'use client'

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPosts, Post, getProfile } from '@/lib/api'
import PostCard from '@/components/PostCard'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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
    } catch (err) {
      // Si no existe perfil, redirigir a onboarding
      router.push('/onboarding')
      return
    }
    
    setCurrentUserEmail(user.email)
    setCheckingAuth(false)
    loadPosts(0)
  }

  useEffect(() => {
    if (!checkingAuth) {
      loadPosts(0)
    }
  }, [checkingAuth])

  const loadPosts = async (pageNum: number) => {
    setLoading(true)
    try {
      const newPosts = await getPosts(pageNum)
      setPosts(newPosts)
      setHasMore(newPosts.length === 5)
      setPage(pageNum)
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (page > 0) {
      loadPosts(page - 1)
    }
  }

  const handleNext = () => {
    if (hasMore) {
      loadPosts(page + 1)
    }
  }

  if (checkingAuth) {
    return <div className="text-white text-center">Cargando...</div>
  }

  if (loading && posts.length === 0) {
    return <div className="text-white text-center">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Publicaciones</h1>
      
      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay publicaciones</p>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserEmail={currentUserEmail || undefined} />
          ))}
          
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={handlePrevious}
              disabled={page === 0 || loading}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-gray-400">Página {page + 1}</span>
            <button
              onClick={handleNext}
              disabled={!hasMore || loading}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

