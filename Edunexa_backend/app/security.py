from datetime import datetime,timedelta,timezone
import jwt,bcrypt
from fastapi import Depends,HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from .config import SECRET_KEY
from .db import get_db,row
bearer=HTTPBearer(auto_error=False)
def hash_password(x):
    if not isinstance(x,str) or len(x)<6: raise ValueError('Password must contain at least 6 characters')
    return bcrypt.hashpw(x.encode(),bcrypt.gensalt()).decode()
def verify_password(x,y):
    try: return bool(y) and bcrypt.checkpw(x.encode(),y.encode())
    except (ValueError,TypeError,UnicodeEncodeError): return False
def token(uid,role): return jwt.encode({'sub':str(uid),'role':role,'exp':datetime.now(timezone.utc)+timedelta(hours=8)},SECRET_KEY,algorithm='HS256')
def current_user(c:HTTPAuthorizationCredentials=Depends(bearer)):
    if not c: raise HTTPException(401,'Authentication required')
    try: uid=int(jwt.decode(c.credentials,SECRET_KEY,algorithms=['HS256'])['sub'])
    except Exception: raise HTTPException(401,'Invalid or expired token')
    with get_db() as db: u=row(db.execute('SELECT * FROM users WHERE id=? AND is_active=1',(uid,)))
    if not u: raise HTTPException(401,'User not found')
    return u
def roles(*allowed):
    def dep(u=Depends(current_user)):
        if u['role'] not in allowed: raise HTTPException(403,'Insufficient permissions')
        return u
    return dep
