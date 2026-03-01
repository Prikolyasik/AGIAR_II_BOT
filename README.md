# IVAN INTELLEKTOVICH — Telegram Bot для аудита бизнеса

Бот на базе ИИ для проведения аудита бизнеса и предложения решений по автоматизации.

## Деплой на Railway

1. Создайте репозиторий на GitHub и запушьте сюда код
2. Зайдите на [Railway](https://railway.app/)
3. Нажмите "New Project" → "Deploy from GitHub repo"
4. Выберите этот репозиторий
5. В настройках сервиса добавьте переменные окружения:
   - `TELEGRAM_BOT_TOKEN` — токен вашего Telegram бота
   - `GROQ_API_KEY` — API ключ Groq
   - `GROQ_MODEL` — модель (например, `llama-3.3-70b-versatile`)
6. Railway автоматически запустит бота

## Локальный запуск

```bash
npm install
cp .env.example .env
# Заполните .env своими ключами
npm start
```

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather |
| `GROQ_API_KEY` | API ключ от https://console.groq.com/keys |
| `GROQ_MODEL` | Модель ИИ (llama-3.3-70b-versatile) |

## Получение ключей

### Telegram Bot Token
1. Напишите @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте полученный токен

### Groq API Key
1. Зайдите на https://console.groq.com/keys
2. Зарегистрируйтесь / войдите
3. Создайте новый API ключ
4. Скопируйте ключ

---

**AGIAR** © 2026
