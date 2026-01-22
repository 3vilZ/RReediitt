'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ChatWidget from '@/components/ChatWidget'

export default function DevChatPage() {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)
  const [testUsers, setTestUsers] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    loadCurrentUser()
    loadTestUsers()
  }, [])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentEmail(user?.email || null)
  }

  const loadTestUsers = async () => {
    try {
      // Obtener usuarios de la base de datos
      const response = await fetch('http://localhost:8000/api/auth/users')
      if (response.ok) {
        const users = await response.json()
        setTestUsers(users.map((u: any) => u.email).filter((email: string) => email !== currentEmail))
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    }
  }

  const switchUser = async (email: string) => {
    try {
      // Cerrar sesión actual
      await supabase.auth.signOut()
      
      // Iniciar sesión con el nuevo usuario
      // Nota: Esto requiere la contraseña, así que mejor mostrar instrucciones
      alert(`Para cambiar de usuario:\n1. Cierra sesión\n2. Inicia sesión con: ${email}\n\nO usa otra ventana del navegador en modo incógnito.`)
    } catch (error) {
      console.error('Error cambiando usuario:', error)
    }
  }

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    alert(`Email copiado: ${email}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Página de Desarrollo - Chat</h1>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Usuario Actual</h2>
        <p className="text-gray-300 mb-4">
          <strong>Email:</strong> {currentEmail || 'No autenticado'}
        </p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          {currentEmail ? 'Cambiar Usuario' : 'Iniciar Sesión'}
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Cómo Probar el Chat</h2>
        <div className="space-y-3 text-gray-300">
          <div>
            <strong className="text-white">Opción 1: Dos Ventanas del Navegador</strong>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>Abre una ventana normal del navegador</li>
              <li>Abre otra ventana en modo incógnito/privado (Ctrl+Shift+N en Chrome/Edge, Ctrl+Shift+P en Firefox)</li>
              <li>En cada ventana, inicia sesión con un usuario diferente</li>
              <li>Ambas ventanas mantendrán sesiones independientes</li>
            </ol>
          </div>
          
          <div>
            <strong className="text-white">Opción 2: Dos Navegadores Diferentes</strong>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>Abre Chrome (o Edge) con un usuario</li>
              <li>Abre Firefox con otro usuario</li>
              <li>Cada navegador mantendrá su propia sesión</li>
            </ol>
          </div>

          <div>
            <strong className="text-white">Opción 3: Herramientas de Desarrollo</strong>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>Abre DevTools (F12)</li>
              <li>Ve a Application → Storage → Cookies</li>
              <li>Elimina las cookies de autenticación para cambiar de usuario</li>
            </ol>
          </div>
        </div>
      </div>

      {testUsers.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usuarios Disponibles</h2>
          <div className="space-y-2">
            {testUsers.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between bg-gray-700 p-3 rounded"
              >
                <span className="text-gray-300">{email}</span>
                <button
                  onClick={() => copyEmail(email)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition"
                >
                  Copiar Email
                </button>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4">
            💡 Copia el email y úsalo para iniciar sesión en otra ventana/navegador
          </p>
        </div>
      )}

      <div className="mt-6 text-gray-400 text-sm">
        <p>💬 El widget de chat está disponible en la esquina inferior derecha de todas las páginas.</p>
      </div>
    </div>
  )
}

