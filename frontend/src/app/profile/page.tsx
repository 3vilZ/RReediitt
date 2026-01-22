'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getUserPosts, deletePost, Post, getProfile, updateProfile, UserProfile, getUserStats, UserStats } from '@/lib/api'
import PostCard from '@/components/PostCard'
import PostForm from '@/components/PostForm'
import UserStatsSidebar from '@/components/UserStatsSidebar'

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (userEmail) {
      loadPosts()
      loadUserStats()
    }
  }, [userEmail])

  const loadUserStats = async () => {
    if (!userEmail) return
    try {
      const stats = await getUserStats(userEmail)
      setUserStats(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      router.push('/login')
      return
    }
    
    // Verificar onboarding
    try {
      const profile = await getProfile(user.email)
      if (!profile.onboarding_completed) {
        router.push('/onboarding')
        return
      }
      setUserProfile(profile)
    } catch (error) {
      // Si no existe perfil, redirigir a onboarding
      router.push('/onboarding')
      return
    }
    
    setUserEmail(user.email)
  }

  const loadPosts = async () => {
    if (!userEmail) return
    setLoading(true)
    try {
      const userPosts = await getUserPosts(userEmail)
      setPosts(userPosts)
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!userEmail) return
    try {
      await deletePost(postId, userEmail)
      await loadPosts()
    } catch (error) {
      console.error('Error eliminando post:', error)
      alert('Error al eliminar la publicación')
    }
  }

  const startEditingProfile = () => {
    if (userProfile) {
      setEditUsername(userProfile.username || '')
      setEditAvatarUrl(userProfile.avatar_url || '')
      setPreviewUrl(userProfile.avatar_url || null)
      setEditingProfile(true)
      setProfileError('')
    }
  }

  const cancelEditingProfile = () => {
    setEditingProfile(false)
    setEditUsername('')
    setEditAvatarUrl('')
    setEditAvatarFile(null)
    setPreviewUrl(null)
    setProfileError('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError('Por favor selecciona un archivo de imagen')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setProfileError('La imagen debe ser menor a 5MB')
        return
      }
      
      setEditAvatarFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setProfileError('')
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail) return

    setSavingProfile(true)
    setProfileError('')

    try {
      if (!editUsername.trim()) {
        setProfileError('El nombre de usuario es obligatorio')
        setSavingProfile(false)
        return
      }

      let finalAvatarUrl = editAvatarUrl

      // Si hay archivo, subirlo primero
      if (editAvatarFile) {
        finalAvatarUrl = await uploadAvatar(editAvatarFile, userEmail)
      }

      // Actualizar el perfil
      const updatedProfile = await updateProfile(userEmail, editUsername.trim(), finalAvatarUrl || undefined)
      setUserProfile(updatedProfile)
      setEditingProfile(false)
      setEditAvatarFile(null)
      
      // Recargar página para actualizar header
      window.location.reload()
    } catch (err: any) {
      setProfileError(err.message || 'Error al guardar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return <div className="text-white text-center">Cargando...</div>
  }

  if (!userEmail) {
    return null
  }

  const displayName = userProfile?.username || userEmail || 'Usuario'

  return (
    <div className="relative">
      <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-4">Mi Perfil</h1>
        
        {/* Mostrar información del perfil */}
        {userProfile && !editingProfile && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              {userProfile.avatar_url ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden">
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.username || userEmail || 'Usuario'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-300 text-2xl font-semibold">
                    {(userProfile.username || userEmail || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{userProfile.username || 'Sin nombre de usuario'}</h2>
                <p className="text-gray-400 text-sm">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={startEditingProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Editar Perfil
            </button>
          </div>
        )}

        {/* Formulario de edición */}
        {editingProfile && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Editar Perfil</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="edit-username" className="block text-gray-300 mb-2">
                  Nombre de usuario *
                </label>
                <input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tu_nombre_usuario"
                />
              </div>

              <div>
                <label htmlFor="edit-avatar" className="block text-gray-300 mb-2">
                  Imagen de perfil
                </label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    id="edit-avatar"
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
                    Seleccionar nueva imagen
                  </button>
                  <div className="text-center text-gray-400 text-sm">o</div>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => {
                      setEditAvatarUrl(e.target.value)
                      setPreviewUrl(e.target.value || null)
                      setEditAvatarFile(null)
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

              {profileError && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded">
                  {profileError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                >
                  {savingProfile ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingProfile}
                  disabled={savingProfile}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <PostForm userEmail={userEmail} onPostCreated={() => loadPosts()} />

      <h2 className="text-2xl font-bold text-white mb-4">Mis Publicaciones</h2>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay publicaciones</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserEmail={userEmail}
            showDelete={true}
            onDelete={handleDelete}
          />
        ))
      )}
      </div>

      {userStats && (
        <div className="absolute left-full top-0 ml-6 w-80">
          <UserStatsSidebar 
            username={displayName}
            stats={userStats}
          />
        </div>
      )}
    </div>
  )
}

