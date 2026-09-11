from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.config import DB_PATH
from app.init_db import seed
if DB_PATH.exists(): DB_PATH.unlink()
seed(); print('Database reset:',DB_PATH)
