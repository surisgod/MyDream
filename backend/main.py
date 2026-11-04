import os
import asyncio
import uuid
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
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