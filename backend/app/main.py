from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.routes import auth, posts, likes, comments, profiles, messages

app = FastAPI(title="RReediitt API", version="1.0.0")

# Configurar CORS ANTES de cualquier otra configuración
# Permitir localhost para desarrollo y URLs de Vercel para producción
import os
from typing import List

def get_allowed_origins() -> List[str]:
    """Obtiene la lista de orígenes permitidos"""
    origins = [
        "http://localhost:3000",  # Frontend Next.js (puerto por defecto)
        "http://localhost:3001",  # Frontend Next.js (puerto alternativo)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    # Agregar URLs de producción si están definidas en variables de entorno
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url)
    
    return origins

def is_origin_allowed(origin: str) -> bool:
    """Verifica si un origen está permitido"""
    allowed = get_allowed_origins()
    
    # Permitir localhost y 127.0.0.1
    if origin in allowed:
        return True
    
    # Permitir cualquier subdominio de vercel.app
    if origin and ".vercel.app" in origin:
        return True
    
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Regex para vercel.app
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Exception handler solo para excepciones no manejadas (no HTTPException)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Obtener el origen de la petición
    origin = request.headers.get("origin", "http://localhost:3001")
    
    # Verificar que el origen esté en la lista permitida
    allowed_origins_list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    # Agregar URL de frontend si está definida
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        allowed_origins_list.append(frontend_url)
    
    # Permitir vercel.app
    is_vercel = origin and ".vercel.app" in origin
    cors_origin = origin if (origin in allowed_origins_list or is_vercel) else "http://localhost:3001"
    
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno del servidor: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Incluir routers
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(likes.router)
app.include_router(comments.router)
app.include_router(profiles.router)
app.include_router(messages.router)


@app.get("/")
async def root():
    return {"message": "RReediitt API"}


@app.get("/health")
async def health():
    return {"status": "ok"}

