import asyncio
import os
import sys
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

# Patch SQLAlchemy's PostgreSQL version parsing to support CockroachDB
try:
    from sqlalchemy.dialects.postgresql.base import PGDialect
    orig_get_server_version_info = PGDialect._get_server_version_info
    def patched_get_server_version_info(self, connection):
        try:
            return orig_get_server_version_info(self, connection)
        except AssertionError:
            return (13, 0, 0)
    PGDialect._get_server_version_info = patched_get_server_version_info
except Exception:
    pass

# Add parent directory to path so app modules are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import the settings and models declarative base
from app.config import get_settings
from app.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    settings = get_settings()
    url = settings.async_database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """Run migrations using an async database engine connection."""
    settings = get_settings()
    
    # Create the async engine
    connectable = create_async_engine(
        settings.async_database_url,
        poolclass=pool.NullPool,
        connect_args={"ssl": True}
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Alembic runs in a sync execution context, so we execute the async migration
    # within the event loop.
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # If an event loop is already running, schedule the task
        loop.create_task(run_async_migrations())
    else:
        asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
