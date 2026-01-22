-- Migración: Agregar sistema de chat entre usuarios
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_email TEXT NOT NULL,
    receiver_email TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_email);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
-- Índice compuesto para búsquedas de conversaciones
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_email, receiver_email, created_at DESC);

-- Habilitar RLS en la tabla de mensajes
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

-- Políticas para mensajes
-- Los usuarios pueden ver mensajes donde son remitente o destinatario
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (
        auth.jwt() ->> 'email' = sender_email OR 
        auth.jwt() ->> 'email' = receiver_email
    );

-- Los usuarios pueden enviar mensajes (solo como remitente)
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = sender_email);

-- Los usuarios pueden marcar como leídos los mensajes que recibieron
CREATE POLICY "Users can update their received messages"
    ON messages FOR UPDATE
    USING (auth.jwt() ->> 'email' = receiver_email)
    WITH CHECK (auth.jwt() ->> 'email' = receiver_email);

-- Habilitar Realtime para la tabla de mensajes
-- Esto permite recibir actualizaciones en tiempo real cuando se insertan nuevos mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

