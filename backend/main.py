import os
import asyncio
import hashlib
import hmac
import json
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional
from urllib.parse import parse_qsl

import httpx
import jwt  # PyJWT[crypto]
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aiogram import Bot, Dispatcher, types, F
from supabase import create_client, Client
from dotenv import load_dotenv

# Загружаем ключи из файла .env
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RENDER_URL = os.getenv("RENDER_EXTERNAL_URL")
OWNER_ID = int(os.getenv("OWNER_ID", "8499249541"))

# --- Авторизация сайта ---
# Приватный ключ ES256 в формате JWK (вывод `npx supabase gen signing-key --algorithm ES256`),
# тот же ключ импортирован в Supabase → Settings → JWT Keys.
SUPABASE_JWT_PRIVATE_JWK = os.getenv("SUPABASE_JWT_PRIVATE_JWK")
# Адреса сайта через запятую, которым разрешено обращаться к /auth/telegram
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
TOKEN_TTL = 3600           # срок жизни токена, секунд
MAX_AUTH_AGE = 24 * 3600   # насколько свежими должны быть данные Telegram, секунд

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SECRET_REPLY = "🤫 Я сохраню это в секрете"


# Функция фонового пинга для Render (ровно 72 раза каждые 10 минут)
async def self_ping():
    if not RENDER_URL:
        print("⚠️ RENDER_EXTERNAL_URL не найден. Само-пинг не запущен.")
        return

    print("🚀 Фоновый пинг-сервис запущен.")
    async with httpx.AsyncClient() as client:
        for i in range(1, 73):  # Ровно 72 раза
            await asyncio.sleep(600)  # 10 минут (600 секунд)
            try:
                response = await client.get(RENDER_URL)
                print(f"🔄 Само-пинг #{i}/72 выполнен. Статус: {response.status_code}")
            except Exception as e:
                print(f"❌ Ошибка при само-пинге #{i}/72: {e}")
    print("🏁 Цикл из 72 само-пингов завершен.")


# Жизненный цикл FastAPI (запуск фоновой задачи при старте)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Запускаем пинг в фоновом режиме, чтобы он не блокировал запуск сервера
    asyncio.create_task(self_ping())
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ---------- Авторизация сайта: проверка данных Telegram и выдача JWT ----------
class AuthRequest(BaseModel):
    init_data: Optional[str] = None   # Telegram Mini App: сырая строка initData
    widget: Optional[dict] = None     # Telegram Login Widget: объект пользователя


def _check_signature(data_check_string: str, secret: bytes, received_hash: Optional[str]):
    calculated = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not received_hash or not hmac.compare_digest(calculated, received_hash):
        raise HTTPException(status_code=401, detail="Неверная подпись Telegram")


def _check_fresh(auth_date) -> None:
    try:
        age = time.time() - int(auth_date)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Нет auth_date")
    if age > MAX_AUTH_AGE or age < -60:
        raise HTTPException(status_code=401, detail="Данные Telegram устарели")


def verify_init_data(init_data: str) -> dict:
    """Проверка initData мини-приложения (секрет = HMAC('WebAppData', токен бота))."""
    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = pairs.pop("hash", None)
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    _check_signature(check_string, secret, received_hash)
    _check_fresh(pairs.get("auth_date"))
    try:
        return json.loads(pairs["user"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Нет данных пользователя")


def verify_login_widget(widget: dict) -> dict:
    """Проверка данных Telegram Login Widget (секрет = SHA256(токен бота))."""
    data = {k: v for k, v in widget.items() if v is not None}
    received_hash = data.pop("hash", None)
    check_string = "\n".join(f"{k}={data[k]}" for k in sorted(data))
    secret = hashlib.sha256(BOT_TOKEN.encode()).digest()
    _check_signature(check_string, secret, received_hash)
    _check_fresh(data.get("auth_date"))
    if "id" not in data:
        raise HTTPException(status_code=401, detail="Нет id пользователя")
    return data


_jwk = json.loads(SUPABASE_JWT_PRIVATE_JWK) if SUPABASE_JWT_PRIVATE_JWK else None
_private_key = jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(_jwk)) if _jwk else None


def mint_supabase_jwt(user_id: int) -> str:
    now = int(time.time())
    payload = {
        "iss": f"{SUPABASE_URL}/auth/v1",
        "aud": "authenticated",
        "role": "authenticated",
        "sub": str(user_id),
        "iat": now,
        "exp": now + TOKEN_TTL,
    }
    return jwt.encode(payload, _private_key, algorithm="ES256", headers={"kid": _jwk["kid"]})


@app.post("/auth/telegram")
async def auth_telegram(body: AuthRequest):
    if _private_key is None:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_PRIVATE_JWK не задан")

    if body.init_data:
        user = verify_init_data(body.init_data)
    elif body.widget:
        user = verify_login_widget(body.widget)
    else:
        raise HTTPException(status_code=400, detail="Нужны init_data или widget")

    user_id = int(user["id"])
    if user_id != OWNER_ID:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    return {"access_token": mint_supabase_jwt(user_id), "expires_in": TOKEN_TTL}

# Все обработчики сообщений работают ТОЛЬКО для владельца.
dp.message.filter(F.from_user.id == OWNER_ID)


async def delete_user_message(message: types.Message):
    """Удаляем сообщение пользователя. Если не вышло — не страшно."""
    try:
        await message.delete()
    except Exception as e:
        print(f"Не удалось удалить сообщение: {e}")


# Команда /start
@dp.message(F.text == "/start")
async def start_cmd(message: types.Message):
    await message.answer("Привет! Отправь мне текст или фото, и я запишу это в твой личный дневник. 📖")


# 1. Обработка обычного текста
@dp.message(F.text & ~F.text.startswith("/"))
async def handle_text(message: types.Message):
    supabase.table("notes").insert({
        "text": message.text,
        "photo_url": None,
        "user_id": message.from_user.id  # владелец записи — аккаунт Telegram
    }).execute()

    await delete_user_message(message)
    await message.answer(SECRET_REPLY)


# 2. Обработка фотографий (с уникальным именем через UUID)
@dp.message(F.photo)
async def handle_photo(message: types.Message):
    photo = message.photo[-1]  # Берем самое качественное фото
    file_info = await bot.get_file(photo.file_id)
    file_bytes = await bot.download_file(file_info.file_path)

    # Генерируем уникальное имя файла с помощью uuid4, чтобы исключить дублирование и ошибки
    unique_filename = f"{uuid.uuid4()}.jpg"
    filename = f"notes/{message.chat.id}/{unique_filename}"

    # Загружаем в бакет diary_photos
    supabase.storage.from_("diary_photos").upload(
        filename,
        file_bytes.read(),
        file_options={"content-type": "image/jpeg"}
    )

    # Получаем публичную ссылку на фото
    photo_url = supabase.storage.from_("diary_photos").get_public_url(filename)

    # Сохраняем в таблицу запись вместе со ссылкой на фото
    caption = message.caption or ""
    supabase.table("notes").insert({
        "text": caption,
        "photo_url": photo_url,
        "user_id": message.from_user.id  # владелец записи — аккаунт Telegram
    }).execute()

    await delete_user_message(message)
    await message.answer(SECRET_REPLY)


# Эндпоинт для вебхуков Telegram
@app.post("/webhook")
async def webhook(request: Request):
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}