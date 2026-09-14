from app.database import engine
from sqlalchemy import text

try:
    result = engine.connect().execute(text("SELECT 1")).scalar()
    print("DATABASE CONNECTED:", result)
except Exception as e:
    print("DATABASE CONNECTION FAILED")
    print(e)