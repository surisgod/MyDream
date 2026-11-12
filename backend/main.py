import os
import asyncio
import hashlib
import hmac
import json
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import httpx
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

# --- Telegram как второй способ входа на сайт (необязательно) ---
# Основной вход на сайте — почта и пароль (Supabase Auth). Telegram привязывается к аккаунту в настройках сайта,
# после чего можно входить через него. Для этого SUPABASE_KEY должен быть сервисным ключом (service_role):
# сервер читает таблицу telegram_links, проверяет вход пользователя и просит у Supabase одноразовый вход.
# Адреса сайта через запятую, которым разрешено обращаться к API (например https://имя.github.io)
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
LOGIN_MAX_AGE = 300   # насколько свежими должны быть данные Telegram при входе и привязке, секунд

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
    allow_headers=["Content-Type", "Authorization"],
)


# ---------- Вход через Telegram: привязка к аккаунту сайта и выдача одноразового входа ----------
class WidgetRequest(BaseModel):
    widget: dict   # данные Telegram Login Widget


def _check_signature(data_check_string: str, secret: bytes, received_hash: Optional[str]):
    calculated = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not received_hash or not hmac.compare_digest(calculated, received_hash):
        raise HTTPException(status_code=401, detail="Неверная подпись Telegram")


def _check_fresh(auth_date) -> None:
    try:
        age = time.time() - int(auth_date)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Нет auth_date")
    if age > LOGIN_MAX_AGE or age < -60:
        raise HTTPException(status_code=401, detail="Данные Telegram устарели")


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


def _current_user(request: Request):
    """Пользователь сайта по токену Supabase Auth из заголовка Authorization."""
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Нужен вход на сайт")
    try:
        result = supabase.auth.get_user(header[7:].strip())
    except Exception:
        raise HTTPException(status_code=401, detail="Вход на сайт недействителен")
    user = getattr(result, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Вход на сайт недействителен")
    return user


def _save_link(user_id: str, tg: dict) -> None:
    telegram_id = int(tg["id"])
    auth_date = int(tg["auth_date"])

    existing = supabase.table("telegram_links").select("user_id,last_auth_date").eq("telegram_id", telegram_id).execute().data
    if existing and existing[0]["user_id"] != user_id:
        raise HTTPException(status_code=409, detail="Этот Telegram уже привязан к другому аккаунту")
    if existing and auth_date <= int(existing[0].get("last_auth_date") or 0):
        raise HTTPException(status_code=401, detail="Данные Telegram уже использованы")

    supabase.table("telegram_links").delete().eq("user_id", user_id).execute()
    supabase.table("telegram_links").insert({
        "telegram_id": telegram_id,
        "user_id": user_id,
        "first_name": tg.get("first_name"),
        "username": tg.get("username"),
        "last_auth_date": auth_date,
    }).execute()


def _login_token_hash(tg: dict) -> str:
    telegram_id = int(tg["id"])
    auth_date = int(tg["auth_date"])

    rows = supabase.table("telegram_links").select("user_id").eq("telegram_id", telegram_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="not_linked")

    # Одни и те же данные Telegram работают один раз: сначала «занимаем» auth_date, и только потом выдаём вход
    claimed = supabase.table("telegram_links").update({"last_auth_date": auth_date}) \
        .eq("telegram_id", telegram_id).lt("last_auth_date", auth_date).execute().data
    if not claimed:
        raise HTTPException(status_code=401, detail="Данные Telegram уже использованы")

    email = supabase.auth.admin.get_user_by_id(rows[0]["user_id"]).user.email
    link = supabase.auth.admin.generate_link({"type": "magiclink", "email": email})
    return link.properties.hashed_token


@app.post("/telegram/link")
async def telegram_link(body: WidgetRequest, request: Request):
    """Привязать Telegram к аккаунту, под которым человек сейчас вошёл на сайте."""
    user = await asyncio.to_thread(_current_user, request)
    tg = verify_login_widget(body.widget)
    if int(tg["id"]) != OWNER_ID:
        raise HTTPException(status_code=403, detail="Этот Telegram нельзя привязать")
    await asyncio.to_thread(_save_link, user.id, tg)
    return {"ok": True}


@app.post("/telegram/unlink")
async def telegram_unlink(request: Request):
    user = await asyncio.to_thread(_current_user, request)
    await asyncio.to_thread(lambda: supabase.table("telegram_links").delete().eq("user_id", user.id).execute())
    return {"ok": True}


@app.post("/auth/telegram")
async def auth_telegram(body: WidgetRequest):
    """Вход через Telegram для привязанного аккаунта. Возвращает одноразовый token_hash:
    сайт обменивает его на обычную сессию Supabase (auth.verifyOtp)."""
    tg = verify_login_widget(body.widget)
    token_hash = await asyncio.to_thread(_login_token_hash, tg)
    return {"token_hash": token_hash}


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

    # Бакет приватный: в записи хранится путь файла, сайт сам получает временную ссылку на показ
    photo_url = filename

    # Сохраняем в таблицу запись вместе с путём к фото
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