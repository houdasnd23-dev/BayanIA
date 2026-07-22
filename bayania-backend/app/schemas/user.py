from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from pydantic import EmailStr
# Profil schemas
class ProfilBase(BaseModel):
    type_profil: str # normal, professionnel, administrateur
class ProfilCreate(ProfilBase):
    pass
class ProfilResponse(ProfilBase):
    id_profil: int
    class Config:
        from_attributes = True
# User schemas
class UserBase(BaseModel):
    nom_user: str
    email: EmailStr
class UserCreate(UserBase):
    mot_de_passe: str
    type_profil: str = "normal" # default type when registering
class UserResponse(UserBase):
    id_user: int
    date_creation_compte: datetime
    id_profil: int
    profil: Optional[ProfilResponse] = None
    class Config:
        from_attributes = True
        
class UserInDB(UserBase):
    id_user: int
    mot_de_passe: str
    id_profil: int
    date_creation_compte: datetime
    class Config:
        from_attributes = True
class UserUpdate(BaseModel):
    nom_user: Optional[str] = None
    email: Optional[EmailStr] = None