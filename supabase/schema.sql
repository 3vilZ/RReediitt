-- Tabla de publicaciones
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de likes/dislikes
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_email)
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de perfiles de usuario
-- Nota: email referencia lógicamente a auth.users(email) pero no podemos crear FK directa
CREATE TABLE IF NOT EXISTS user_profiles (
    email TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_posts_user_email ON posts(user_email);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Políticas RLS (Row Level Security)

-- Habilitar RLS en todas las tablas
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para posts
-- Eliminar políticas existentes si existen (para permitir re-ejecutar el script)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Todos pueden ver posts
CREATE POLICY "Posts are viewable by everyone"
    ON posts FOR SELECT
    USING (true);

-- Los usuarios autenticados pueden crear posts
CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    WITH CHECK (true);

-- Los usuarios solo pueden borrar sus propios posts
CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (auth.jwt() ->> 'email' = user_email);

-- Políticas para likes
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can update own likes" ON likes;

-- Todos pueden ver likes
CREATE POLICY "Likes are viewable by everyone"
    ON likes FOR SELECT
    USING (true);

-- Los usuarios autenticados pueden crear/actualizar likes
CREATE POLICY "Users can insert likes"
    ON likes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own likes"
    ON likes FOR UPDATE
    USING (auth.jwt() ->> 'email' = user_email);

-- Políticas para comentarios
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;

-- Todos pueden ver comentarios
CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    USING (true);

-- Los usuarios autenticados pueden crear comentarios
CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (true);

-- Políticas para user_profiles
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Todos pueden ver perfiles
CREATE POLICY "Profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

-- Los usuarios pueden insertar su propio perfil (al registrarse)
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = email);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.jwt() ->> 'email' = email)
    WITH CHECK (auth.jwt() ->> 'email' = email);

