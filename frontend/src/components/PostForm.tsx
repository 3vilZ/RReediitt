'use client'

import { useState } from 'react'
import { createPost, Post } from '@/lib/api'

interface PostFormProps {
  userEmail: string
  onPostCreated?: (post: Post) => void
}

export default function PostForm({ userEmail, onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('El contenido no puede estar vacío')
      return
    }

    if (image && video) {
      setError('No puedes subir imagen y video al mismo tiempo. Elige uno.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const post = await createPost(content, userEmail, image || undefined, video || undefined)
      setContent('')
      setImage(null)
      setVideo(null)
      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>
      fileInputs.forEach(input => input.value = '')
      if (onPostCreated) {
        onPostCreated(post)
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al crear la publicación'
      setError(errorMessage)
      console.error('Error creando post:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    if (file) {
      setVideo(null) // Limpiar video si se selecciona imagen
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setVideo(file)
    if (file) {
      setImage(null) // Limpiar imagen si se selecciona video
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu publicación..."
        className="w-full bg-gray-900 text-white border border-gray-700 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={4}
      />
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {image ? 'Cambiar imagen' : 'Subir imagen'}
        </label>
        {image && (
          <span className="text-gray-400 text-sm">{image.name}</span>
        )}
        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
          />
          {video ? 'Cambiar video' : 'Subir video'}
        </label>
        {video && (
          <span className="text-gray-400 text-sm">{video.name}</span>
        )}
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition disabled:opacity-50"
      >
        {loading ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  )
}

