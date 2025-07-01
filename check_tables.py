from app.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name;
    """))
    print("Tables in database (all schemas):")
    for row in result:
        print(f"  - {row[0]}.{row[1]}") 