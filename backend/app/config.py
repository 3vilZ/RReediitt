from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde .env manualmente
# Intentar múltiples rutas posibles
env_path = None
possible_paths = [
    Path(__file__).parent.parent / ".env",  # backend/.env
    Path.cwd() / ".env",  # Directorio actual/.env
    Path(__file__).parent / ".env",  # backend/app/.env
]

for path in possible_paths:
    if path.exists():
        env_path = path
        break

if env_path:
    load_dotenv(dotenv_path=env_path, override=True)
else:
    # Intentar cargar desde el directorio de trabajo actual
    load_dotenv(override=True)

class Settings:
    def __init__(self):
        # Obtener variables de entorno (cargadas por load_dotenv)
        # Manejar el caso del BOM (Byte Order Mark) que puede estar presente en el archivo .env
        # Buscar la variable con y sin BOM
        self.supabase_url = (
            os.getenv("SUPABASE_URL") or 
            os.getenv("supabase_url") or 
            os.getenv("\ufeffSUPABASE_URL") or  # Con BOM
            os.getenv("\ufeffsupabase_url")     # Con BOM en minúsculas
        )
        self.supabase_key = (
            os.getenv("SUPABASE_KEY") or 
            os.getenv("supabase_key") or
            os.getenv("\ufeffSUPABASE_KEY") or  # Con BOM
            os.getenv("\ufeffsupabase_key")     # Con BOM en minúsculas
        )
        self.supabase_service_key = (
            os.getenv("SUPABASE_SERVICE_KEY") or 
            os.getenv("supabase_service_key") or
            os.getenv("\ufeffSUPABASE_SERVICE_KEY") or  # Con BOM
            os.getenv("\ufeffsupabase_service_key")     # Con BOM en minúsculas
        )
        
        # Limpiar el BOM si está presente en los valores
        if self.supabase_url and self.supabase_url.startswith("\ufeff"):
            self.supabase_url = self.supabase_url[1:]
        if self.supabase_key and self.supabase_key.startswith("\ufeff"):
            self.supabase_key = self.supabase_key[1:]
        if self.supabase_service_key and self.supabase_service_key.startswith("\ufeff"):
            self.supabase_service_key = self.supabase_service_key[1:]
        
        # Mensajes de error más informativos
        if not self.supabase_url:
            env_path_used = env_path if env_path else "No se encontró archivo .env"
            raise ValueError(
                f"SUPABASE_URL no encontrada en el archivo .env. "
                f"Ruta buscada: {env_path_used}. "
                f"Verifica que el archivo .env tenga el formato correcto."
            )
        if not self.supabase_key:
            raise ValueError("SUPABASE_KEY no encontrada en el archivo .env")
        if not self.supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_KEY no encontrada en el archivo .env")


settings = Settings()

