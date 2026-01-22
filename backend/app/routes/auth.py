from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models import User
from typing import List

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/users", response_model=List[User])
async def get_users():
    """Obtiene la lista de todos los usuarios registrados con sus perfiles"""
    unique_emails = []
    
    # Primero intentar obtener usuarios de los posts (más confiable)
    try:
        posts_response = supabase.table("posts").select("user_email").execute()
        if posts_response.data:
            unique_emails = list(set([post.get("user_email") for post in posts_response.data if post.get("user_email")]))
    except Exception as e:
        pass  # Continuar con el siguiente método
    
    # Como fallback, intentar obtener usuarios del Admin API
    if not unique_emails:
        try:
            response = supabase.auth.admin.list_users()
            
            # Manejar diferentes formatos de respuesta
            users_list = []
            if isinstance(response, list):
                users_list = response
            elif hasattr(response, 'users') and isinstance(response.users, list):
                users_list = response.users
            elif hasattr(response, 'data') and isinstance(response.data, list):
                users_list = response.data
            
            for user in users_list:
                email = None
                # Intentar obtener email de diferentes formas
                if isinstance(user, dict):
                    email = user.get('email') or user.get('user_email')
                elif hasattr(user, 'email'):
                    email = user.email
                elif hasattr(user, 'user_email'):
                    email = user.user_email
                
                if email and email not in unique_emails:
                    unique_emails.append(email)
        except Exception as e:
            pass
    
    if not unique_emails:
        return []
    
    # Obtener perfiles de los usuarios
    try:
        profiles_response = supabase.table("user_profiles").select("email, username, avatar_url").in_("email", unique_emails).execute()
        profiles_dict = {profile["email"]: profile for profile in profiles_response.data}
        
        # Crear lista de usuarios con información del perfil
        users = []
        for email in unique_emails:
            profile = profiles_dict.get(email, {})
            users.append(User(
                email=email,
                username=profile.get("username"),
                avatar_url=profile.get("avatar_url")
            ))
        
        return users
    except Exception as e:
        # Si falla, devolver usuarios solo con email
        return [User(email=email) for email in unique_emails]

