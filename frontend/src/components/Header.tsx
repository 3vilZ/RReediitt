'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { getUsers, User, getProfile, UserProfile } from '@/lib/api'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkUser()
    if (pathname !== '/login' && pathname !== '/onboarding') {
      loadUsers()
    }
  }, [pathname])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserEmail(user?.email || null)
    
    if (user?.email) {
      try {
        const profile = await getProfile(user.email)
        setUserProfile(profile)
      } catch (err) {
        // Perfil no encontrado, no hacer nada
        setUserProfile(null)
      }
    } else {
      setUserProfile(null)
    }
  }

  const loadUsers = async () => {
    try {
      const usersList = await getUsers()
      setUsers(usersList || [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      // En caso de error, establecer lista vacía para evitar problemas
      setUsers([])
    }
  }

  const handleUserSelect = (email: string) => {
    setSelectedUser(email)
    setIsDropdownOpen(false)
    // Obtener el username del usuario seleccionado
    const selected = users.find(u => u.email === email)
    const identifier = selected?.username || email
    router.push(`/user/${encodeURIComponent(identifier)}`)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // No mostrar header en la página de login ni onboarding
  if (pathname === '/login' || pathname === '/onboarding') {
    return null
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Título izquierda */}
        <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition">
          RReediitt
        </Link>

        {/* Dropdown centro personalizado */}
        <div className="flex-1 max-w-md mx-4 user-dropdown-container relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-3 hover:bg-gray-750"
          >
            <span className="flex-1 text-left">
              {selectedUser
                ? (() => {
                    const selected = users.find(u => u.email === selectedUser)
                    return selected?.username || selected?.email || 'Seleccionar usuario...'
                  })()
                : 'Seleccionar usuario...'}
            </span>
            <span className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-sm">No hay usuarios</div>
              ) : (
                users.map((user) => {
                  const displayName = user.username || user.email
                  return (
                    <button
                      key={user.email}
                      onClick={() => handleUserSelect(user.email)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition text-left"
                    >
                      {user.avatar_url ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={user.avatar_url}
                            alt={displayName || 'Usuario'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-300 text-sm font-semibold">
                            {(displayName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-white font-medium flex-1">{displayName}</span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Botones derecha */}
        <div className="flex items-center gap-3">
          {userProfile && (
            <div className="flex items-center gap-2 hidden sm:flex">
              {userProfile.avatar_url ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.username || userEmail || 'Usuario'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-300 text-sm font-semibold">
                    {(userProfile.username || userEmail || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-gray-300 text-sm font-medium">
                {userProfile.username || userEmail}
              </span>
            </div>
          )}
          {userEmail && (
            <Link
              href="/profile"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Perfil
            </Link>
          )}
          {userEmail && (
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
            >
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

