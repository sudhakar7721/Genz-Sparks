import sqlite3
from app.security import verify_password

DB_PATH = "data/edunexa.db"
EMAIL = "arun_kumar@example.com"
PASSWORD = "123456"

with sqlite3.connect(DB_PATH) as db:
    row = db.execute(
        "SELECT password_hash FROM users WHERE email=? COLLATE NOCASE",
        (EMAIL,),
    ).fetchone()

print("User found:", row is not None)
print("Password valid:", bool(row and verify_password(PASSWORD, row[0])))
