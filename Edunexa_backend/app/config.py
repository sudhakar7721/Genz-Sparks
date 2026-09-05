import os
from pathlib import Path
BASE_DIR=Path(__file__).resolve().parent.parent
DB_PATH=Path(os.getenv('EDUNEXA_DB_PATH',BASE_DIR/'data'/'edunexa.db'))
UPLOAD_DIR=Path(os.getenv('EDUNEXA_UPLOAD_DIR',BASE_DIR/'uploads'))
SECRET_KEY=os.getenv('EDUNEXA_SECRET_KEY','edunexa-development-secret-change-me')
CORS_ORIGINS=[x.strip() for x in os.getenv('EDUNEXA_CORS_ORIGINS','http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000').split(',') if x.strip()]
DB_PATH.parent.mkdir(parents=True,exist_ok=True); UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
