from fastapi import APIRouter, HTTPException, Query
from app.database import supabase
from app.models import UserProfile, UserProfileCreate, UserProfileUpdate, UserStats
from typing import Optional

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/{identifier}", response_model=UserProfile)
async def get_profile(identifier: str):
    """Obtiene el perfil de un usuario por su email o username"""
    try:
        # Intentar buscar por username primero (más común en URLs)
        response = supabase.table("user_profiles").select("*").eq("username", identifier).execute()
        if not response.data:
            # Si no se encuentra por username, intentar por email
            response = supabase.table("user_profiles").select("*").eq("email", identifier).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        return UserProfile(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo perfil: {str(e)}")


@router.post("/", response_model=UserProfile)
async def create_profile(profile: UserProfileCreate):
    """Crea un perfil de usuario"""
    try:
        response = supabase.table("user_profiles").insert(profile.dict()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Error creando perfil")
        return UserProfile(**response.data[0])
    except Exception as e:
        error_detail = str(e)
        if "duplicate key" in error_detail.lower() or "unique constraint" in error_detail.lower():
            raise HTTPException(status_code=400, detail="El perfil ya existe o el nombre de usuario está en uso")
        raise HTTPException(status_code=500, detail=f"Error creando perfil: {error_detail}")


@router.put("/{email}", response_model=UserProfile)
async def update_profile(email: str, profile_update: UserProfileUpdate):
    """Actualiza el perfil de un usuario"""
    try:
        update_data = {k: v for k, v in profile_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
        update_data["updated_at"] = "now()"
        
        response = supabase.table("user_profiles").update(update_data).eq("email", email).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        return UserProfile(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        error_detail = str(e)
        if "duplicate key" in error_detail.lower() or "unique constraint" in error_detail.lower():
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
        raise HTTPException(status_code=500, detail=f"Error actualizando perfil: {error_detail}")


@router.get("/{identifier}/stats", response_model=UserStats)
async def get_user_stats(identifier: str):
    """Obtiene las estadísticas de un usuario por email o username"""
    try:
        # Obtener el email del usuario (buscando por username o email)
        # Intentar primero por username
        profile_response = supabase.table("user_profiles").select("email").eq("username", identifier).execute()
        
        # Si no se encuentra por username, intentar por email
        if not profile_response.data:
            profile_response = supabase.table("user_profiles").select("email").eq("email", identifier).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        email = profile_response.data[0]["email"]
        
        # Obtener posts del usuario
        posts_response = supabase.table("posts").select("id").eq("user_email", email).execute()
        total_posts = len(posts_response.data) if posts_response.data else 0
        post_ids = [post["id"] for post in posts_response.data] if posts_response.data else []
        
        # Obtener comentarios del usuario
        comments_response = supabase.table("comments").select("id").eq("user_email", email).execute()
        total_comments = len(comments_response.data) if comments_response.data else 0
        
        # Obtener likes y dislikes recibidos (en posts del usuario)
        total_likes_received = 0
        total_dislikes_received = 0
        
        if post_ids:
            likes_response = supabase.table("likes").select("is_like").in_("post_id", post_ids).execute()
            if likes_response.data:
                total_likes_received = sum(1 for like in likes_response.data if like.get("is_like") is True)
                total_dislikes_received = sum(1 for like in likes_response.data if like.get("is_like") is False)
        
        return UserStats(
            total_posts=total_posts,
            total_comments=total_comments,
            total_likes_received=total_likes_received,
            total_dislikes_received=total_dislikes_received
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

