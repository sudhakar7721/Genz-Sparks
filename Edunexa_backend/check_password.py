import sqlite3
from app.security import verify_password

db = sqlite3.connect("data/edunexa.db")

row = db.execute(
    "SELECT password_hash FROM users WHERE email = ?",
    ("arun_kumar@example.com",)
).fetchone()

print("User found:", row is not None)

if row:
    result = verify_password("123456", row[0])
    print("Password valid:", result)

db.close()