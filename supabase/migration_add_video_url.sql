-- Migración: Agregar soporte para videos en publicaciones
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Agregar columna video_url a la tabla posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Nota: Los videos se almacenarán en el mismo bucket 'post-images' de Supabase Storage
-- o puedes crear un bucket separado 'post-videos' si lo prefieres.
-- Las políticas de Storage existentes para 'post-images' deberían funcionar para videos también.

