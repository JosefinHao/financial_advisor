from app.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Delete alembic_version table
    conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
    conn.commit()
    print("Database reset complete") 