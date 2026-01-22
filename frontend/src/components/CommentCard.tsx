'use client'

import Image from 'next/image'
import { Comment } from '@/lib/api'

interface CommentCardProps {
  comment: Comment
}

export default function CommentCard({ comment }: CommentCardProps) {
  const displayName = comment.username || comment.user_email
  const displayAvatar = comment.avatar_url

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
      <div className="flex items-center gap-3 mb-2">
        {displayAvatar ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={displayAvatar}
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
        <p className="text-gray-300 font-medium text-sm">{displayName}</p>
      </div>
      <p className="text-white whitespace-pre-wrap">{comment.content}</p>
    </div>
  )
}

