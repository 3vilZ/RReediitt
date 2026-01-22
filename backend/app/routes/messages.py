from fastapi import APIRouter, HTTPException, Query
from app.database import supabase
from app.models import Message, MessageCreate
from typing import List
from uuid import UUID

router = APIRouter(prefix="/api/messages", tags=["messages"])


async def enrich_messages_with_profiles(messages_data: List[dict]) -> List[dict]:
    """ Enriquece los mensajes con información del perfil de los usuarios"""
    if not messages_data:
        return messages_data
    
    # Obtener todos los emails únicos (remitentes y destinatarios)
    emails = set()
    for msg in messages_data:
        if msg.get("sender_email"):
            emails.add(msg["sender_email"])
        if msg.get("receiver_email"):
            emails.add(msg["receiver_email"])
    
    if not emails:
        return messages_data
    
    # Obtener perfiles en una sola query
    try:
        profiles_response = supabase.table("user_profiles").select("email, username, avatar_url").in_("email", list(emails)).execute()
        profiles_dict = {profile["email"]: profile for profile in profiles_response.data}
        
        # Enriquecer cada mensaje con información del perfil
        for msg in messages_data:
            sender_email = msg.get("sender_email")
            receiver_email = msg.get("receiver_email")
            
            if sender_email in profiles_dict:
                profile = profiles_dict[sender_email]
                msg["sender_username"] = profile.get("username")
                msg["sender_avatar_url"] = profile.get("avatar_url")
            
            if receiver_email in profiles_dict:
                profile = profiles_dict[receiver_email]
                msg["receiver_username"] = profile.get("username")
                msg["receiver_avatar_url"] = profile.get("avatar_url")
    except Exception as e:
        # Si hay error, continuar sin enriquecer
        print(f"Error enriqueciendo mensajes con perfiles: {str(e)}")
    
    return messages_data


@router.get("/conversations", response_model=List[dict])
async def get_conversations(user_email: str = Query(...)):
    """Obtiene la lista de conversaciones del usuario (usuarios con los que ha intercambiado mensajes)"""
    try:
        # Obtener mensajes donde el usuario es remitente o destinatario
        # Hacemos dos queries y las combinamos
        sent_response = supabase.table("messages") \
            .select("sender_email, receiver_email, created_at") \
            .eq("sender_email", user_email) \
            .order("created_at", desc=True) \
            .execute()
        
        received_response = supabase.table("messages") \
            .select("sender_email, receiver_email, created_at") \
            .eq("receiver_email", user_email) \
            .order("created_at", desc=True) \
            .execute()
        
        # Combinar resultados
        all_messages = (sent_response.data or []) + (received_response.data or [])
        # Ordenar por fecha descendente
        all_messages.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Obtener usuarios únicos con los que ha conversado
        conversations = {}
        for msg in all_messages:
            other_email = msg["receiver_email"] if msg["sender_email"] == user_email else msg["sender_email"]
            if other_email not in conversations:
                conversations[other_email] = {
                    "email": other_email,
                    "last_message_at": msg["created_at"]
                }
        
        # Obtener perfiles de los usuarios
        if conversations:
            emails = list(conversations.keys())
            profiles_response = supabase.table("user_profiles").select("email, username, avatar_url").in_("email", emails).execute()
            profiles_dict = {profile["email"]: profile for profile in profiles_response.data}
            
            # Enriquecer conversaciones con información del perfil
            result = []
            for email, conv in conversations.items():
                profile = profiles_dict.get(email, {})
                result.append({
                    "email": email,
                    "username": profile.get("username"),
                    "avatar_url": profile.get("avatar_url"),
                    "last_message_at": conv["last_message_at"]
                })
            
            return result
        
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo conversaciones: {str(e)}")


@router.get("/conversation/{other_email}", response_model=List[Message])
async def get_conversation(other_email: str, user_email: str = Query(...)):
    """Obtiene todos los mensajes de una conversación entre dos usuarios"""
    try:
        
        # Obtener mensajes donde ambos usuarios están involucrados
        # Hacemos dos queries y las combinamos
        sent_response = supabase.table("messages") \
            .select("*") \
            .eq("sender_email", user_email) \
            .eq("receiver_email", other_email) \
            .order("created_at", desc=False) \
            .execute()
        
        received_response = supabase.table("messages") \
            .select("*") \
            .eq("sender_email", other_email) \
            .eq("receiver_email", user_email) \
            .order("created_at", desc=False) \
            .execute()
        
        # Combinar y ordenar
        all_messages = (sent_response.data or []) + (received_response.data or [])
        all_messages.sort(key=lambda x: x.get("created_at", ""), reverse=False)
        
        enriched_data = await enrich_messages_with_profiles(all_messages)
        messages = [Message(**msg) for msg in enriched_data]
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo conversación: {str(e)}")


@router.post("/", response_model=Message)
async def send_message(message: MessageCreate, sender_email: str = Query(...)):
    """Envía un mensaje de un usuario a otro"""
    try:
        if sender_email == message.receiver_email:
            raise HTTPException(status_code=400, detail="No puedes enviarte un mensaje a ti mismo")
        
        message_data = {
            "sender_email": sender_email,
            "receiver_email": message.receiver_email,
            "content": message.content,
            "read": False
        }
        
        response = supabase.table("messages").insert(message_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Error enviando mensaje")
        
        enriched_data = await enrich_messages_with_profiles([response.data[0]])
        return Message(**enriched_data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando mensaje: {str(e)}")


@router.put("/{message_id}/read")
async def mark_as_read(message_id: UUID, user_email: str = Query(...)):
    """Marca un mensaje como leído"""
    try:
        # Verificar que el mensaje pertenece al usuario
        response = supabase.table("messages") \
            .select("*") \
            .eq("id", str(message_id)) \
            .eq("receiver_email", user_email) \
            .single() \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        
        # Marcar como leído
        supabase.table("messages") \
            .update({"read": True}) \
            .eq("id", str(message_id)) \
            .execute()
        
        return {"message": "Mensaje marcado como leído"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marcando mensaje como leído: {str(e)}")


@router.get("/unread-count")
async def get_unread_count(user_email: str = Query(...)):
    """Obtiene el número de mensajes no leídos del usuario"""
    try:
        response = supabase.table("messages") \
            .select("id", count="exact") \
            .eq("receiver_email", user_email) \
            .eq("read", False) \
            .execute()
        
        return {"unread_count": response.count if hasattr(response, 'count') else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo conteo de no leídos: {str(e)}")

