'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getUserPosts, Post, getProfile, UserProfile, getUserStats, UserStats } from '@/lib/api'
import PostCard from '@/components/PostCard'
import UserStatsSidebar from '@/components/UserStatsSidebar'

export default function UserPage() {
  const params = useParams()
  const username = decodeURIComponent(params.username as string)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  useEffect(() => {
    checkUser()
    loadUserProfile()
  }, [username])

  useEffect(() => {
    if (userProfile) {
      loadPosts()
      loadUserStats()
    }
  }, [userProfile])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserEmail(user?.email || null)
  }

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile(username)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error cargando perfil:', error)
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    if (!userProfile) return
    try {
      const stats = await getUserStats(username)
      setUserStats(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const loadPosts = async () => {
    if (!userProfile) return
    setLoading(true)
    try {
      const userPosts = await getUserPosts(username)
      setPosts(userPosts)
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-white text-center">Cargando...</div>
  }

  if (!userProfile) {
    return <div className="text-white text-center">Usuario no encontrado</div>
  }

  const displayName = userProfile.username || userProfile.email
  const displayAvatar = userProfile.avatar_url

  return (
    <div className="flex gap-6 relative -mx-4">
      <div className="w-full max-w-4xl px-4">
        <div className="flex items-center gap-4 mb-6">
          {displayAvatar ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              <Image
                src={displayAvatar}
                alt={displayName || 'Usuario'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-gray-300 text-2xl font-semibold">
                {(displayName || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-white">{displayName}</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay publicaciones</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserEmail={currentUserEmail || undefined} />
          ))
        )}
      </div>

      {userStats && (
        <div className="absolute left-full ml-6 top-0 w-80 flex-shrink-0">
          <UserStatsSidebar 
            username={displayName}
            stats={userStats}
          />
        </div>
      )}
    </div>
  )
}

