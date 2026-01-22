'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Post, LikeCount, getLikeCount, createLike } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ImageModal from './ImageModal'

interface PostCardProps {
  post: Post
  currentUserEmail?: string
  showDelete?: boolean
  onDelete?: (postId: string) => void
}

export default function PostCard({ post, currentUserEmail, showDelete = false, onDelete }: PostCardProps) {
  const [likeCount, setLikeCount] = useState<LikeCount>({ likes: 0, dislikes: 0 })
  const [loading, setLoading] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadLikeCount()
  }, [post.id])

  const loadLikeCount = async () => {
    try {
      const count = await getLikeCount(post.id)
      setLikeCount(count)
    } catch (error) {
      console.error('Error cargando likes:', error)
    }
  }

  const handleLike = async (isLike: boolean) => {
    if (!currentUserEmail) {
      router.push('/profile')
      return
    }
    
    setLoading(true)
    try {
      await createLike(post.id, currentUserEmail, isLike)
      await loadLikeCount()
    } catch (error) {
      console.error('Error actualizando like:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayName = post.username || post.user_email
  const displayAvatar = post.avatar_url
  const userIdentifier = post.username || post.user_email

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link href={`/user/${encodeURIComponent(userIdentifier)}`} className="flex items-center gap-3 mb-2 hover:opacity-80 transition">
            {displayAvatar ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                <Image
                  src={displayAvatar}
                  alt={displayName || 'Usuario'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 cursor-pointer">
                <span className="text-gray-300 text-sm font-semibold">
                  {(displayName || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <p className="text-gray-300 font-medium cursor-pointer">{displayName}</p>
          </Link>
          <Link href={`/post/${post.id}`} className="block">
            <p className="text-white whitespace-pre-wrap">{post.content}</p>
          </Link>
        </div>
        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="ml-4 text-red-400 hover:text-red-300 px-2 py-1 rounded"
          >
            Eliminar
          </button>
        )}
      </div>

      {post.image_url && (
        <div className="mb-4 cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="rounded-lg max-w-full h-auto hover:opacity-90 transition"
          />
        </div>
      )}

      {post.image_url && (
        <ImageModal
          imageUrl={post.image_url}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      {post.video_url && (
        <div className="mb-4">
          <video
            src={post.video_url}
            controls
            className="rounded-lg max-w-full h-auto"
            style={{ maxHeight: '600px' }}
          >
            Tu navegador no soporta la reproducción de videos.
          </video>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => handleLike(true)}
          disabled={loading}
          className="flex items-center gap-2 text-green-400 hover:text-green-300 disabled:opacity-50"
        >
          <span>👍</span>
          <span>{likeCount.likes}</span>
        </button>
        <button
          onClick={() => handleLike(false)}
          disabled={loading}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          <span>👎</span>
          <span>{likeCount.dislikes}</span>
        </button>
        <Link
          href={`/post/${post.id}`}
          className="ml-auto text-blue-400 hover:text-blue-300"
        >
          Ver comentarios
        </Link>
      </div>
    </div>
  )
}

