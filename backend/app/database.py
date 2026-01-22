from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Crea y retorna un cliente de Supabase usando la service key"""
    return create_client(settings.supabase_url, settings.supabase_service_key)


supabase: Client = get_supabase_client()

