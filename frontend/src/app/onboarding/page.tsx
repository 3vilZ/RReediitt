'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProfile, createProfile } from '@/lib/api'
import Image from 'next/image'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      router.push('/login')
      return
    }
    
    setUserEmail(user.email)
    
    // Verificar si ya completó el onboarding
    try {
      const profile = await getProfile(user.email)
      if (profile.onboarding_completed) {
        router.push('/')
      }
    } catch (err) {
      // El perfil no existe, continuar con onboarding
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('La imagen debe ser menor a 5MB')
        return
      }
      
      setAvatarFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError('')
    }
  }

  const uploadAvatar = async (file: File, email: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `avatars/${email.replace('@', '_at_').replace('.', '_')}/${fileName}`

    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio')
      setLoading(false)
      return
    }

    if (!avatarFile && !avatarUrl) {
      setError('Debes seleccionar una imagen de perfil o proporcionar una URL')
      setLoading(false)
      return
    }

    if (!userEmail) {
      setError('Error: No se pudo obtener el email del usuario')
      setLoading(false)
      return
    }

    try {
      let finalAvatarUrl = avatarUrl

      // Si hay archivo, subirlo primero
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(avatarFile, userEmail)
      }

      // Crear el perfil
      await createProfile(userEmail, username.trim(), finalAvatarUrl)
      
      // Redirigir a la página principal
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Error al completar el perfil')
    } finally {
      setLoading(false)
    }
  }

  if (!userEmail) {
    return <div className="text-white text-center">Cargando...</div>
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Completa tu perfil
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-300 mb-2">
              Nombre de usuario *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu_nombre_usuario"
            />
          </div>

          <div>
            <label htmlFor="avatar" className="block text-gray-300 mb-2">
              Imagen de perfil *
            </label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 hover:bg-gray-600 transition"
              >
                Seleccionar imagen
              </button>
              <div className="text-center text-gray-400 text-sm">o</div>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value)
                  setPreviewUrl(e.target.value || null)
                  setAvatarFile(null)
                }}
                placeholder="URL de imagen (opcional si subes archivo)"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {previewUrl && (
              <div className="mt-2 flex justify-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}

