#gere le stockage et recuperation des fichiers envoyes
import os
import uuid
import shutil
from fastapi import UploadFile
from app.core.config import settings
class FileStorage:
    @staticmethod
    def save_file(file: UploadFile) -> str:
        """
        Saves an uploaded file to the configured upload directory.
        Returns the absolute or relative path to the saved file.
        """
        upload_dir = settings.UPLOAD_DIR
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir, exist_ok=True)
            
        # Generate a unique name to avoid filename collisions
        file_uuid = uuid.uuid4().hex
        original_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{file_uuid}{original_ext}"
        
        target_path = os.path.join(upload_dir, unique_filename)
        
        # Write file contents
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return target_path