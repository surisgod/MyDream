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

# Тот же ID, что указан в index.html (MY_TELEGRAM_ID).
# При желании можно переопределить через переменную OWNER_ID в .env
OWNER_ID = int(os.getenv("OWNER_ID", "8499249541"))

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()

# Все обработчики сообщений работают ТОЛЬКО для владельца.
# Сообщения от любого другого ID не попадают ни в один обработчик,
# поэтому бот молчит и ничего не делает.
dp.message.filter(F.from_user.id == OWNER_ID)

SECRET_REPLY = "🤫 Я сохраню это в секрете"


async def delete_user_message(message: types.Message):
    """Удаляем сообщение пользователя. Если не вышло — не страшно."""
    try:
        await message.delete()
    except Exception as e:
        print(f"Не удалось удалить сообщение: {e}")


# Команда /start (стоит первой, иначе её перехватит обработчик текста)
@dp.message(F.text == "/start")
async def start_cmd(message: types.Message):
    await message.answer("Привет! Отправь мне текст или фото, и я запишу это в твой личный дневник. 📖")


# 1. Обработка обычного текста (команды вроде /start игнорируем)
@dp.message(F.text & ~F.text.startswith("/"))
async def handle_text(message: types.Message):
    # Сохраняем текст в таблицу notes
    supabase.table("notes").insert({
        "text": message.text,
        "photo_url": None
    }).execute()

    # Сначала сохранили, и только потом удаляем сообщение
    await delete_user_message(message)
    await message.answer(SECRET_REPLY)


# 2. Обработка фотографий (с текстом или без)
@dp.message(F.photo)
async def handle_photo(message: types.Message):
    photo = message.photo[-1]  # Берем самое качественное фото
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

    await delete_user_message(message)
    await message.answer(SECRET_REPLY)


# Эндпоинт для вебхуков Telegram
@app.post("/webhook")
async def webhook(request: Request):
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}
