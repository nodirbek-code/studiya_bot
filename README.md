# 🎬 Studio Booking — Telegram Bot + Mini App

Professional foto/video studiya uchun to'liq bron tizimi.

## Tuzilma

```
studio-booking/
├── api/          FastAPI backend
├── bot/          aiogram 3 Telegram bot
├── miniapp/      React + Vite Telegram Mini App
├── workers/      Celery tasks (eslatmalar, broadcast)
├── migrations/   Alembic DB migratsiyalar
├── nginx/        Nginx konfiguratsiya
└── docker-compose.yml
```

## Ishga tushirish

### 1. Muhitni sozlash
```bash
make setup          # .env.example → .env
nano .env           # qiymatlarni to'ldiring
```

### 2. .env asosiy sozlamalar
```env
BOT_TOKEN=         # @BotFather dan
WEBHOOK_SECRET=    # ixtiyoriy tasodifiy string (32+ belgi)
WEBHOOK_HOST=      # https://yourdomain.com
ADMIN_IDS=         # Telegram ID (vergul bilan: 123,456)
DATABASE_URL=      # postgresql+asyncpg://...
PAYME_SECRET_KEY=  # Payme merchant key
CLICK_SECRET_KEY=  # Click secret
```

### 3. Docker bilan ishga tushirish
```bash
make up            # Barcha servislarni ishga tushirish
make migrate       # DB migratsiyalarni bajarish
make logs          # Loglarni ko'rish
```

### 4. Mini App build
```bash
cd miniapp
npm install
npm run build      # dist/ papkasi yaratiladi
```

## Admin buyruqlari (bot)

| Buyruq | Vazifa |
|--------|--------|
| `/schedule` | Bugungi ish vaqtini kiritish |
| `/broadcast` | Barcha yoki bronlagan mijozlarga xabar |
| `/stats` | Statistika (bugun / hafta / oy) |
| `/cancel` | Joriy amalni bekor qilish |

## Xavfsizlik

- Telegram `initData` HMAC-SHA256 bilan tekshiriladi
- To'lov idempotency key — takror to'lovdan saqlaydi
- Race condition: `SELECT FOR UPDATE SKIP LOCKED`
- Rate limiting: Redis sliding window
- Barcha maxfiy ma'lumotlar `.env` da, kodda yo'q

## Texnologiyalar

| Qatlam | Stack |
|--------|-------|
| Bot | Python 3.11 + aiogram 3 |
| Backend | FastAPI + SQLAlchemy 2 + PostgreSQL |
| Mini App | React 18 + Vite + Tailwind CSS |
| Queue | Celery + Redis |
| To'lov | Payme API + Click API |
| Deploy | Docker Compose + Nginx |

## Rivojlantirish

```bash
# API
cd api && uvicorn main:app --reload

# Bot
cd bot && python main.py

# Mini App
cd miniapp && npm run dev
```
