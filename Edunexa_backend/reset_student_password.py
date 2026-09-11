import sqlite3
from app.security import hash_password

DB_PATH = "data/edunexa.db"
NEW_PASSWORD = "123456"

db = sqlite3.connect(DB_PATH)

new_hash = hash_password(NEW_PASSWORD)

cursor = db.execute(
    """
    UPDATE users
    SET password_hash = ?
    WHERE role = 'student'
    """,
    (new_hash,)
)

db.commit()

updated = cursor.rowcount

print("======================================")
print("EduNexa Student Password Reset")
print("======================================")
print("Students updated :", updated)
print("New password     : 123456")
print("======================================")

db.close()