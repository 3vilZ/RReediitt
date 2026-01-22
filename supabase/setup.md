# Configuración de Supabase para RReediitt

## 1. Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - **Name**: RReediitt (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Elige la región más cercana
5. Haz clic en "Create new project"
6. Espera a que se complete la configuración (puede tardar 1-2 minutos)

## 2. Ejecutar el esquema SQL

1. En el panel de Supabase, ve a **SQL Editor** (icono de editor SQL en el menú lateral)
2. Haz clic en "New query"
3. Copia el contenido del archivo `schema.sql`
4. Pega el SQL en el editor
5. Haz clic en "Run" o presiona `Ctrl+Enter`
6. Verifica que no haya errores

## 3. Configurar Storage para imágenes

1. Ve a **Storage** en el menú lateral
2. Haz clic en "Create a new bucket"
3. Configura el bucket:
   - **Name**: `post-images`
   - **Public bucket**: Activa esta opción (para que las imágenes sean accesibles públicamente)
4. Haz clic en "Create bucket"

### Configurar políticas de Storage

1. Una vez creado el bucket, haz clic en "policies" (o en el nombre del bucket)
2. Haz clic en "New Policy" o en "Add policy"
3. Selecciona "For full customization" o crea una política personalizada
4. Para permitir que todos suban y lean imágenes:

```sql
-- Política para permitir subir archivos (autenticados)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

-- Política para permitir leer archivos (público)
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');
```

Pega estas políticas en el SQL Editor y ejecuta.

## 4. Obtener las credenciales

1. Ve a **Project Settings** (icono de engranaje en el menú lateral)
2. Ve a **API** en el menú
3. Encuentra las siguientes credenciales:
   - **Project URL**: Copia esta URL (se usará como `SUPABASE_URL`)
   - **anon/public key**: Copia esta clave (se usará como `SUPABASE_KEY` o `SUPABASE_ANON_KEY`)
   - **service_role key**: Copia esta clave (se usará como `SUPABASE_SERVICE_KEY`) - ⚠️ Mantén esta clave secreta

## 5. Configurar variables de entorno

Usa las credenciales obtenidas en el paso 4 para configurar los archivos `.env`:

### Backend (`backend/.env`)
```
SUPABASE_URL=tu_project_url_aqui
SUPABASE_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_KEY=tu_service_role_key_aqui
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 6. Verificar la configuración

1. Asegúrate de que las tablas se crearon correctamente:
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver las tablas: `posts`, `likes`, `comments`

2. Verifica que el bucket de Storage existe:
   - Ve a **Storage**
   - Deberías ver el bucket `post-images`

## Notas importantes

- **Service Role Key**: Esta clave tiene permisos de administrador. NUNCA la expongas en el frontend. Solo úsala en el backend.
- **RLS (Row Level Security)**: Las políticas RLS están configuradas para permitir:
  - Lectura pública de posts, likes y comentarios
  - Creación de contenido por usuarios autenticados
  - Eliminación de posts solo por el autor
- **Storage**: Las imágenes se almacenarán en el bucket `post-images` y serán accesibles públicamente.

