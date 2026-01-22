from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import Optional, List
from uuid import UUID
from app.database import supabase
from app.models import Post
import secrets

router = APIRouter(prefix="/api/posts", tags=["posts"])


async def enrich_posts_with_profiles(posts_data: List[dict]) -> List[dict]:
    """ Enriquece los posts con información del perfil del usuario (username y avatar_url)"""
    if not posts_data:
        return posts_data
    
    # Obtener todos los emails únicos
    emails = list(set([post.get("user_email") for post in posts_data if post.get("user_email")]))
    
    if not emails:
        return posts_data
    
    # Obtener perfiles en una sola query
    try:
        profiles_response = supabase.table("user_profiles").select("email, username, avatar_url").in_("email", emails).execute()
        profiles_dict = {profile["email"]: profile for profile in profiles_response.data}
        
        # Enriquecer cada post con información del perfil
        for post in posts_data:
            email = post.get("user_email")
            if email in profiles_dict:
                profile = profiles_dict[email]
                post["username"] = profile.get("username")
                post["avatar_url"] = profile.get("avatar_url")
    except Exception as e:
        # Si hay error, continuar sin enriquecer
        print(f"Error enriqueciendo posts con perfiles: {str(e)}")
    
    return posts_data


async def upload_image_to_supabase(file: UploadFile, user_email: str) -> str:
    """Sube una imagen a Supabase Storage y retorna la URL pública"""
    try:
        # Generar nombre único para el archivo
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        file_name = f"{secrets.token_urlsafe(16)}.{file_ext}"
        
        # Leer contenido del archivo
        contents = await file.read()
        
        # Subir a Supabase Storage
        bucket = "post-images"
        # Sanitizar el email para usarlo como parte de la ruta
        safe_email = user_email.replace("@", "_at_").replace(".", "_")
        file_path = f"{safe_email}/{file_name}"
        
        upload_response = supabase.storage.from_(bucket).upload(
            file_path,
            contents,
            file_options={"content-type": file.content_type or "image/jpeg", "upsert": "true"}
        )
        
        # Verificar si hubo error en la subida
        if hasattr(upload_response, 'error') and upload_response.error:
            raise Exception(f"Error de Supabase Storage: {upload_response.error}")
        
        # Obtener URL pública
        public_url_response = supabase.storage.from_(bucket).get_public_url(file_path)
        return public_url_response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {str(e)}")


async def upload_video_to_supabase(file: UploadFile, user_email: str) -> str:
    """Sube un video a Supabase Storage y retorna la URL pública"""
    try:
        # Generar nombre único para el archivo
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
        file_name = f"{secrets.token_urlsafe(16)}.{file_ext}"
        
        # Leer contenido del archivo
        contents = await file.read()
        
        # Subir a Supabase Storage (usamos el mismo bucket)
        bucket = "post-images"
        # Sanitizar el email para usarlo como parte de la ruta
        safe_email = user_email.replace("@", "_at_").replace(".", "_")
        file_path = f"{safe_email}/videos/{file_name}"
        
        upload_response = supabase.storage.from_(bucket).upload(
            file_path,
            contents,
            file_options={"content-type": file.content_type or "video/mp4", "upsert": "true"}
        )
        
        # Verificar si hubo error en la subida
        if hasattr(upload_response, 'error') and upload_response.error:
            raise Exception(f"Error de Supabase Storage: {upload_response.error}")
        
        # Obtener URL pública
        public_url_response = supabase.storage.from_(bucket).get_public_url(file_path)
        return public_url_response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo video: {str(e)}")


@router.get("/", response_model=List[Post])
async def get_posts(page: int = 0, limit: int = 5):
    """Obtiene posts paginados, ordenados por fecha descendente"""
    try:
        offset = page * limit
        response = supabase.table("posts") \
            .select("*") \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        enriched_data = await enrich_posts_with_profiles(response.data)
        posts = [Post(**post) for post in enriched_data]
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo posts: {str(e)}")


@router.get("/{post_id}", response_model=Post)
async def get_post(post_id: UUID):
    """Obtiene un post específico por ID"""
    try:
        response = supabase.table("posts") \
            .select("*") \
            .eq("id", str(post_id)) \
            .single() \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Post no encontrado")
        
        enriched_data = await enrich_posts_with_profiles([response.data])
        return Post(**enriched_data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo post: {str(e)}")


@router.get("/user/{identifier}", response_model=List[Post])
async def get_user_posts(identifier: str):
    """Obtiene todos los posts de un usuario específico por email o username"""
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
        
        response = supabase.table("posts") \
            .select("*") \
            .eq("user_email", email) \
            .order("created_at", desc=True) \
            .execute()
        
        enriched_data = await enrich_posts_with_profiles(response.data)
        posts = [Post(**post) for post in enriched_data]
        return posts
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo posts del usuario: {str(e)}")


@router.post("/", response_model=Post)
async def create_post(
    content: str = Form(...),
    user_email: str = Form(...),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None)
):
    """Crea un nuevo post con texto, imagen opcional o video opcional"""
    try:
        image_url = None
        video_url = None
        
        # Verificar que no se suban imagen y video al mismo tiempo
        if image and video:
            raise HTTPException(status_code=400, detail="No puedes subir imagen y video al mismo tiempo. Elige uno.")
        
        # Si hay imagen, subirla a Supabase Storage
        if image and image.filename:
            try:
                image_url = await upload_image_to_supabase(image, user_email)
            except HTTPException as e:
                # Si falla la subida de imagen, aún permitir crear el post sin imagen
                print(f"Advertencia: No se pudo subir la imagen: {e.detail}")
                # Continuar sin imagen en lugar de fallar completamente
        
        # Si hay video, subirlo a Supabase Storage
        if video and video.filename:
            try:
                video_url = await upload_video_to_supabase(video, user_email)
            except HTTPException as e:
                # Si falla la subida de video, aún permitir crear el post sin video
                print(f"Advertencia: No se pudo subir el video: {e.detail}")
                # Continuar sin video en lugar de fallar completamente
        
        # Crear el post
        post_data = {
            "user_email": user_email,
            "content": content,
            "image_url": image_url,
            "video_url": video_url
        }
        
        response = supabase.table("posts").insert(post_data).execute()
        
        if not response.data:
            error_detail = "Error creando post: respuesta vacía de Supabase"
            if hasattr(response, 'error') and response.error:
                error_detail = f"Error creando post: {response.error}"
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Validar que los datos devueltos sean correctos
        post_dict = response.data[0]
        if not post_dict.get("id"):
            raise HTTPException(status_code=500, detail="Error: el post creado no tiene ID")
        
        return Post(**post_dict)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error creando post: {str(e)}"
        print(f"Error completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.delete("/{post_id}")
async def delete_post(post_id: UUID, user_email: str = Query(...)):
    """Borra un post (solo si pertenece al usuario)"""
    try:
        # Verificar que el post pertenece al usuario
        response = supabase.table("posts") \
            .select("*") \
            .eq("id", str(post_id)) \
            .eq("user_email", user_email) \
            .single() \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Post no encontrado o no tienes permisos")
        
        # Borrar el post (los likes y comentarios se borran en cascada)
        supabase.table("posts").delete().eq("id", str(post_id)).execute()
        
        return {"message": "Post eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando post: {str(e)}")

