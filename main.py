import os
from fastapi import FastAPI, Request
from aiogram import Bot, Dispatcher, types, F
from supabase import create_client, Client
from dotenv import load_dotenv

# Загружаем ключи из файла .env
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()

# 1. Обработка обычного текста
@dp.message(F.text)
async def handle_text(message: types.Message):
    # Игнорируем команды вроде /start
    if message.text.startswith("/"):
        return
    
    # Сохраняем текст в таблицу notes
    supabase.table("notes").insert({
        "text": message.text,
        "photo_url": None
    }).execute()
    
    await message.answer("📝 Заметка сохранена в дневник!")

# 2. Обработка фотографий (с текстом или без)
@dp.message(F.photo)
async def handle_photo(message: types.Message):
    photo = message.photo[-1] # Берем самое качественное фото
    file_info = await bot.get_file(photo.file_id)
    file_bytes = await bot.download_file(file_info.file_path)

    # Путь для сохранения в Supabase Storage
    filename = f"notes/{message.chat.id}/{photo.file_id}.jpg"
    
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
        "photo_url": photo_url
    }).execute()

    await message.answer("📸 Фото и заметка успешно сохранены!")

# Команда /start
@dp.message(F.text == "/start")
async def start_cmd(message: types.Message):
    await message.answer("Привет! Отправь мне текст или фото, и я запишу это в твой личный дневник. 📖")

# Эндпоинт для вебхуков Telegram
@app.post("/webhook")
async def webhook(request: Request):
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}