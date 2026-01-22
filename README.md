# RReediitt

Una aplicación web estilo Reddit desarrollada con FastAPI (backend), Next.js (frontend) y Supabase (base de datos y autenticación).

## Características

- **Autenticación**: Sistema de login/registro con Supabase Auth
- **Publicaciones**: Crear, ver y eliminar publicaciones con texto e imágenes
- **Interacción**: Sistema de likes/dislikes y comentarios
- **Perfiles**: Perfil personal y visualización de perfiles de otros usuarios
- **Feed**: Página principal con todas las publicaciones paginadas

## Stack Tecnológico

- **Backend**: Python + FastAPI
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage para imágenes

## Requisitos Previos

- Python 3.9+
- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## Configuración

### 1. Configurar Supabase

1. Sigue las instrucciones en `supabase/setup.md` para:
   - Crear un proyecto en Supabase
   - Ejecutar el esquema SQL
   - Configurar Storage
   - Obtener las credenciales

### 2. Configurar Backend

1. Navega a la carpeta del backend:
```bash
cd backend
```

2. Crea un entorno virtual (recomendado):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

3. Instala las dependencias:
```bash
pip install -r requirements.txt
```

4. Crea un archivo `.env` en la carpeta `backend/`:
```
SUPABASE_URL=tu_supabase_project_url
SUPABASE_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_KEY=tu_supabase_service_role_key
```

### 3. Configurar Frontend

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` en la carpeta `frontend/`:
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Ejecución

### Backend

Desde la carpeta `backend/`:

```bash
# Asegúrate de tener el entorno virtual activado
uvicorn app.main:app --reload
```

El backend estará disponible en `http://localhost:8000`

### Frontend

Desde la carpeta `frontend/`:

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
RReediitt/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Servidor FastAPI
│   │   ├── config.py            # Configuración
│   │   ├── database.py          # Cliente Supabase
│   │   ├── models.py            # Modelos Pydantic
│   │   └── routes/
│   │       ├── auth.py          # Endpoints de autenticación
│   │       ├── posts.py         # Endpoints de publicaciones
│   │       ├── likes.py         # Endpoints de likes/dislikes
│   │       └── comments.py      # Endpoints de comentarios
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── layout.tsx       # Layout principal
│   │   │   ├── page.tsx         # Feed principal
│   │   │   ├── profile/         # Pantalla de perfil
│   │   │   ├── user/[email]/    # Pantalla de usuario
│   │   │   └── post/[id]/       # Pantalla de publicación
│   │   ├── components/          # Componentes React
│   │   ├── lib/                 # Utilidades (API, Supabase)
│   │   └── styles/              # Estilos CSS
│   ├── package.json
│   └── .env.local.example
├── supabase/
│   ├── schema.sql               # Esquema de base de datos
│   └── setup.md                 # Instrucciones de configuración
└── README.md
```

## API Endpoints

### Autenticación
- `GET /api/auth/users` - Obtener lista de usuarios

### Publicaciones
- `GET /api/posts/` - Obtener posts paginados (query: page, limit)
- `GET /api/posts/{post_id}` - Obtener un post específico
- `GET /api/posts/user/{email}` - Obtener posts de un usuario
- `POST /api/posts/` - Crear un post (form-data: content, user_email, image)
- `DELETE /api/posts/{post_id}` - Borrar un post (query: user_email)

### Likes
- `POST /api/likes/` - Crear/actualizar like/dislike
- `GET /api/likes/post/{post_id}` - Obtener conteo de likes/dislikes

### Comentarios
- `GET /api/comments/post/{post_id}` - Obtener comentarios de un post
- `POST /api/comments/` - Crear un comentario

## Funcionalidades Principales

### Pantalla General (Feed)
- Muestra todas las publicaciones
- Paginación (5 posts por página)
- Orden cronológico inverso (más recientes primero)

### Pantalla de Perfil
- Ver publicaciones propias
- Crear nuevas publicaciones (texto + imagen opcional)
- Eliminar publicaciones propias
- Botón de logout

### Pantalla de Usuario
- Ver email del usuario
- Ver todas sus publicaciones
- Click en publicación para ver detalles

### Pantalla de Publicación
- Ver contenido completo del post
- Sistema de likes/dislikes
- Añadir comentarios
- Ver lista de comentarios

## Notas Importantes

- **Service Role Key**: Nunca expongas la `SUPABASE_SERVICE_KEY` en el frontend. Solo úsala en el backend.
- **RLS (Row Level Security)**: Las políticas RLS están configuradas en Supabase para seguridad.
- **Storage**: Las imágenes se almacenan en Supabase Storage en el bucket `post-images`.
- **Autenticación**: El perfil requiere autenticación. Otras pantallas son públicas.

## Desarrollo

Para desarrollo, ambos servidores (backend y frontend) deben estar ejecutándose simultáneamente.

El backend incluye CORS configurado para `http://localhost:3000`.

## Solución de Problemas

### Error de conexión a Supabase
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el proyecto de Supabase esté activo

### Error de CORS
- Verifica que el backend esté ejecutándose en `http://localhost:8000`
- Verifica la configuración de CORS en `backend/app/main.py`

### Error al subir imágenes
- Verifica que el bucket `post-images` existe en Supabase Storage
- Verifica que las políticas de Storage estén configuradas correctamente

