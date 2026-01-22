'use client'

interface UserStatsSidebarProps {
  username: string
  stats: {
    total_posts: number
    total_comments: number
    total_likes_received: number
    total_dislikes_received: number
  }
}

export default function UserStatsSidebar({ username, stats }: UserStatsSidebarProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-4">
      <h2 className="text-2xl font-bold text-white mb-6">{username}</h2>
      
      <div className="space-y-6">
        {/* Fila 1: Publicaciones y Comentarios */}
        <div className="grid grid-cols-2 gap-4 border-b border-gray-700 pb-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Publicaciones</div>
            <div className="text-white font-semibold text-xl">{stats.total_posts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Comentarios</div>
            <div className="text-white font-semibold text-xl">{stats.total_comments}</div>
          </div>
        </div>

        {/* Fila 2: Me gusta y No me gusta */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Me gusta</div>
            <div className="text-green-400 font-semibold text-xl">{stats.total_likes_received}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">No me gusta</div>
            <div className="text-red-400 font-semibold text-xl">{stats.total_dislikes_received}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

