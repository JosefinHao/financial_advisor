from app.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Drop user tables if they exist
    conn.execute(text("""
        DROP TABLE IF EXISTS messages CASCADE;
        DROP TABLE IF EXISTS conversations CASCADE;
        DROP TABLE IF EXISTS alembic_version CASCADE;
    """))
    conn.commit()
    print("All relevant tables dropped (messages, conversations, alembic_version)") 