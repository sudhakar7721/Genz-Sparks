import sqlite3
from contextlib import contextmanager
from .config import DB_PATH

def connect():
 c=sqlite3.connect(DB_PATH,check_same_thread=False); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); c.execute('PRAGMA journal_mode=WAL'); return c
@contextmanager
def get_db():
 c=connect()
 try: yield c; c.commit()
 except Exception: c.rollback(); raise
 finally: c.close()
def rows(cur): return [dict(x) for x in cur.fetchall()]
def row(cur):
 x=cur.fetchone(); return dict(x) if x else None
