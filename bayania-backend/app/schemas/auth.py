from pydantic import BaseModel, EmailStr
from typing import Optional
class LoginRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
class TokenPayload(BaseModel):
    sub: Optional[str] = None