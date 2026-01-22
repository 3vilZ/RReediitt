from fastapi import APIRouter, HTTPException
from uuid import UUID
from typing import List
from app.database import supabase
from app.models import Comment, CommentCreate

router = APIRouter(prefix="/api/comments", tags=["comments"])


async def enrich_comments_with_profiles(comments_data: List[dict]) -> List[dict]:
    """ Enriquece los comentarios con información del perfil del usuario (username y avatar_url)"""
    if not comments_data:
        return comments_data
    
    # Obtener todos los emails únicos
    emails = list(set([comment.get("user_email") for comment in comments_data if comment.get("user_email")]))
    
    if not emails:
        return comments_data
    
    # Obtener perfiles en una sola query
    try:
        profiles_response = supabase.table("user_profiles").select("email, username, avatar_url").in_("email", emails).execute()
        profiles_dict = {profile["email"]: profile for profile in profiles_response.data}
        
        # Enriquecer cada comentario con información del perfil
        for comment in comments_data:
            email = comment.get("user_email")
            if email in profiles_dict:
                profile = profiles_dict[email]
                comment["username"] = profile.get("username")
                comment["avatar_url"] = profile.get("avatar_url")
    except Exception as e:
        # Si hay error, continuar sin enriquecer
        print(f"Error enriqueciendo comentarios con perfiles: {str(e)}")
    
    return comments_data


@router.get("/post/{post_id}", response_model=List[Comment])
async def get_comments(post_id: UUID):
    """Obtiene todos los comentarios de un post"""
    try:
        response = supabase.table("comments") \
            .select("*") \
            .eq("post_id", str(post_id)) \
            .order("created_at", desc=False) \
            .execute()
        
        enriched_data = await enrich_comments_with_profiles(response.data)
        comments = [Comment(**comment) for comment in enriched_data]
        return comments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo comentarios: {str(e)}")


@router.post("/", response_model=Comment)
async def create_comment(comment: CommentCreate):
    """Crea un nuevo comentario"""
    try:
        comment_data = {
            "post_id": str(comment.post_id),
            "user_email": comment.user_email,
            "content": comment.content
        }
        
        response = supabase.table("comments").insert(comment_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Error creando comentario")
        
        return Comment(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando comentario: {str(e)}")

