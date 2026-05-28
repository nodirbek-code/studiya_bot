"""
Studio Booking — FastAPI asosiy fayl
"""
from contextlib import asynccontextmanager
import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.database import engine, Base
from routers import bookings, catalog, payments, reviews, admin, webhook, studio

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App ishga tushganda va to'xtaganda"""
    logger.info("Starting Studio Booking API", environment=settings.environment)
    # Jadvallarni yaratish (dev uchun — prod'da Alembic ishlatiladi)
    if settings.debug:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Shutting down Studio Booking API")
    await engine.dispose()


app = FastAPI(
    title="Studio Booking API",
    version="1.0.0",
    docs_url="/api/docs" if settings.debug else None,  # prod'da yopiladi
    redoc_url=None,
    lifespan=lifespan,
)

# ─── CORS — faqat Mini App domenidan ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.webhook_host,
        "https://web.telegram.org",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


# ─── Global xato tutgich ──────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Server xatosi yuz berdi"},
    )


# ─── Routerlar ────────────────────────────────────────────────
app.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(studio.router, prefix="/api/studio", tags=["studio"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
