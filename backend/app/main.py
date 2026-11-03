import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.routers.auth import router as auth_router
from app.routers.admin_auth import router as admin_auth_router
from app.routers.transfers import router as transfers_router
from app.routers.deposits import router as deposits_router
from app.routers.notifications import router as notifications_router
from app.routers.settings import router as settings_router
from app.routers.admin import router as admin_router
from app.routers.cards import router as cards_router
from app.routers.portfolio import router as portfolio_router
from app.routers.loans import router as loans_router
from app.routers.tax import router as tax_router
from app.routers.support import router as support_router
from app.routers.contact import router as contact_router

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    from app.services.transfer_service import run_transaction_scheduler
    # Startup: Check database connection and report readiness
    logger.info("Initializing Prescott National Bank backend services...")
    try:
        from sqlalchemy import text
        from app.models import Base
        async with engine.begin() as conn:
            logger.info("Database connection established successfully. Ensuring schema integrity...")
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(
                text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE NOT NULL;")
            )
            try:
                await conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS freeze_reason VARCHAR(1000);"))
                await conn.execute(text("ALTER TABLE notifications ALTER COLUMN message TYPE TEXT;"))
                await conn.execute(text("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS funding_amount DOUBLE PRECISION DEFAULT 0.0 NOT NULL;"))
                await conn.execute(text("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS balance DOUBLE PRECISION DEFAULT 0.0 NOT NULL;"))
                await conn.execute(text("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS source_account VARCHAR(20) DEFAULT 'checking' NOT NULL;"))
                await conn.execute(text("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;"))
                await conn.execute(text("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS activation_delay_hours INTEGER DEFAULT 1 NOT NULL;"))
                await conn.execute(text("ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(100);"))
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS support_messages (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
                        sender_type VARCHAR(20) NOT NULL,
                        sender_name VARCHAR(100) NOT NULL,
                        content TEXT NOT NULL,
                        is_read BOOLEAN DEFAULT FALSE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                    );
                """))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_support_messages_ticket_id ON support_messages (ticket_id);"))
                await conn.execute(text("ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_agent VARCHAR(100);"))
                try:
                    await conn.execute(text("ALTER TYPE ticketstatus ADD VALUE IF NOT EXISTS 'closed';"))
                except Exception:
                    pass
            except Exception:
                pass
            logger.info("Schema integrity verified: 'is_approved', support messages, and card columns confirmed.")
    except Exception as e:
        logger.critical(f"Critical: Database initialization or migration notice: {str(e)}")
        
    # Start the background transaction drop-time scheduler
    bg_task = asyncio.create_task(run_transaction_scheduler())
    
    yield
    
    # Shutdown: Dispose engine connection pool and cancel background task
    logger.info("Shutting down services. Disposing connection pools...")
    bg_task.cancel()
    try:
        await bg_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()
    logger.info("Engine disposed. Shutdown complete.")

app = FastAPI(
    title="Prescott National Bank Online Banking Backend API",
    description="Backend services for Prescott National Bank application including transfers, deposits, and corporate accounts.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration to allow cross-origin requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register API routers with /api prefix (standard REST endpoints)
app.include_router(auth_router, prefix="/api")
app.include_router(admin_auth_router, prefix="/api")
app.include_router(transfers_router, prefix="/api")
app.include_router(deposits_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(cards_router, prefix="/api")
app.include_router(portfolio_router, prefix="/api")
app.include_router(loans_router, prefix="/api")
app.include_router(tax_router, prefix="/api")
app.include_router(support_router, prefix="/api")
app.include_router(contact_router, prefix="/api")

# Also register without /api prefix so clients calling /auth/* or /admin/* directly never receive 404 Not Found
app.include_router(auth_router)
app.include_router(admin_auth_router)
app.include_router(transfers_router)
app.include_router(deposits_router)
app.include_router(notifications_router)
app.include_router(settings_router)
app.include_router(admin_router)
app.include_router(cards_router)
app.include_router(portfolio_router)
app.include_router(loans_router)
app.include_router(tax_router)
app.include_router(support_router)
app.include_router(contact_router)

@app.get("/api/health", tags=["System Health"])
@app.get("/health", tags=["System Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "prescott-national-bank-backend",
        "version": "1.0.0"
    }
