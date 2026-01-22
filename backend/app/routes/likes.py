from fastapi import APIRouter, HTTPException
from uuid import UUID
from app.database import supabase
from app.models import LikeCreate, LikeCount

router = APIRouter(prefix="/api/likes", tags=["likes"])


@router.post("/")
async def create_or_update_like(like: LikeCreate):
    """Crea o actualiza un like/dislike en un post"""
    try:
        # Intentar insertar o actualizar (upsert)
        like_data = {
            "post_id": str(like.post_id),
            "user_email": like.user_email,
            "is_like": like.is_like
        }
        
        # Verificar si ya existe un like de este usuario para este post
        existing = supabase.table("likes") \
            .select("*") \
            .eq("post_id", str(like.post_id)) \
            .eq("user_email", like.user_email) \
            .execute()
        
        if existing.data:
            # Actualizar
            response = supabase.table("likes") \
                .update({"is_like": like.is_like}) \
                .eq("post_id", str(like.post_id)) \
                .eq("user_email", like.user_email) \
                .execute()
        else:
            # Insertar
            response = supabase.table("likes").insert(like_data).execute()
        
        return {"message": "Like actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando like: {str(e)}")


@router.get("/post/{post_id}", response_model=LikeCount)
async def get_like_count(post_id: UUID):
    """Obtiene el conteo de likes y dislikes de un post"""
    try:
        response = supabase.table("likes") \
            .select("*") \
            .eq("post_id", str(post_id)) \
            .execute()
        
        likes_count = sum(1 for like in response.data if like.get("is_like") is True)
        dislikes_count = sum(1 for like in response.data if like.get("is_like") is False)
        
        return LikeCount(likes=likes_count, dislikes=dislikes_count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo conteo de likes: {str(e)}")

