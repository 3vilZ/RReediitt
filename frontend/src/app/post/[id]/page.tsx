'use client'

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getPost, getComments, createComment, getLikeCount, createLike, LikeCount, Comment } from '@/lib/api'
import CommentCard from '@/components/CommentCard'
import ImageModal from '@/components/ImageModal'

export default function PostPage() {
  const params = useParams()
  const postId = params.id as string
  const router = useRouter()
  
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likeCount, setLikeCount] = useState<LikeCount>({ likes: 0, dislikes: 0 })
  const [commentContent, setCommentContent] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  useEffect(() => {
    checkUser()
    loadData()
  }, [postId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserEmail(user?.email || null)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [postData, commentsData, likesData] = await Promise.all([
        getPost(postId),
        getComments(postId),
        getLikeCount(postId)
      ])
      setPost(postData)
      setComments(commentsData)
      setLikeCount(likesData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim() || !userEmail) {
      if (!userEmail) {
        router.push('/profile')
      }
      return
    }

    setSubmitting(true)
    try {
      await createComment(postId, userEmail, commentContent)
      setCommentContent('')
      await loadData()
    } catch (error) {
      console.error('Error creando comentario:', error)
      alert('Error al crear el comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (isLike: boolean) => {
    if (!userEmail) {
      router.push('/profile')
      return
    }

    try {
      await createLike(postId, userEmail, isLike)
      const likesData = await getLikeCount(postId)
      setLikeCount(likesData)
    } catch (error) {
      console.error('Error actualizando like:', error)
    }
  }

  if (loading) {
    return <div className="text-white text-center">Cargando...</div>
  }

  if (!post) {
    return <div className="text-white text-center">Publicación no encontrada</div>
  }

  return (
    <div>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {post.avatar_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={post.avatar_url}
                alt={post.username || post.user_email || 'Usuario'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-300 font-semibold">
                {(post.username || post.user_email || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <p className="text-gray-300 font-medium">{post.username || post.user_email}</p>
        </div>
        <p className="text-white whitespace-pre-wrap mb-4">{post.content}</p>

        {post.image_url && (
          <>
            <div className="mb-4 cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
              <Image
                src={post.image_url}
                alt="Post image"
                width={600}
                height={400}
                className="rounded-lg max-w-full h-auto hover:opacity-90 transition"
              />
            </div>
            <ImageModal
              imageUrl={post.image_url}
              isOpen={isImageModalOpen}
              onClose={() => setIsImageModalOpen(false)}
            />
          </>
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
            className="flex items-center gap-2 text-green-400 hover:text-green-300"
          >
            <span>👍</span>
            <span>{likeCount.likes}</span>
          </button>
          <button
            onClick={() => handleLike(false)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <span>👎</span>
            <span>{likeCount.dislikes}</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Añadir comentario</h2>
        <form onSubmit={handleSubmitComment}>
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Escribe tu comentario..."
            className="w-full bg-gray-900 text-white border border-gray-700 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting || !commentContent.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition disabled:opacity-50"
          >
            {submitting ? 'Publicando...' : 'Añadir comentario'}
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">Comentarios</h2>

      {comments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay comentarios</p>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))
      )}
    </div>
  )
}

