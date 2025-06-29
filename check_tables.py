from app.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"))
    print("Tables in database:")
    for row in result:
        print(f"  - {row[0]}") 