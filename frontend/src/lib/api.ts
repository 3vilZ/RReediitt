const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Post {
  id: string
  user_email: string
  content: string
  image_url: string | null
  video_url: string | null
  created_at: string
  username?: string | null
  avatar_url?: string | null
}

export interface Comment {
  id: string
  post_id: string
  user_email: string
  content: string
  created_at: string
  username?: string | null
  avatar_url?: string | null
}

export interface LikeCount {
  likes: number
  dislikes: number
}

export interface User {
  email: string
  username?: string | null
  avatar_url?: string | null
}

export interface UserProfile {
  email: string
  username: string | null
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export async function getPosts(page: number = 0): Promise<Post[]> {
  const response = await fetch(`${API_URL}/api/posts/?page=${page}&limit=5`)
  if (!response.ok) throw new Error('Error obteniendo posts')
  return response.json()
}

export async function getPost(postId: string): Promise<Post> {
  const response = await fetch(`${API_URL}/api/posts/${postId}`)
  if (!response.ok) throw new Error('Error obteniendo post')
  return response.json()
}

export async function getUserPosts(identifier: string): Promise<Post[]> {
  const response = await fetch(`${API_URL}/api/posts/user/${encodeURIComponent(identifier)}`)
  if (!response.ok) throw new Error('Error obteniendo posts del usuario')
  return response.json()
}

export async function createPost(
  content: string,
  userEmail: string,
  image?: File,
  video?: File
): Promise<Post> {
  const formData = new FormData()
  formData.append('content', content)
  formData.append('user_email', userEmail)
  if (image) {
    formData.append('image', image)
  }
  if (video) {
    formData.append('video', video)
  }

  const response = await fetch(`${API_URL}/api/posts/`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = 'Error creando post'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
  
  return response.json()
}

export async function deletePost(postId: string, userEmail: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/posts/${postId}?user_email=${encodeURIComponent(userEmail)}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Error eliminando post')
}

export async function getComments(postId: string): Promise<Comment[]> {
  const response = await fetch(`${API_URL}/api/comments/post/${postId}`)
  if (!response.ok) throw new Error('Error obteniendo comentarios')
  return response.json()
}

export async function createComment(
  postId: string,
  userEmail: string,
  content: string
): Promise<Comment> {
  const response = await fetch(`${API_URL}/api/comments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_id: postId,
      user_email: userEmail,
      content,
    }),
  })
  if (!response.ok) throw new Error('Error creando comentario')
  return response.json()
}

export async function getLikeCount(postId: string): Promise<LikeCount> {
  const response = await fetch(`${API_URL}/api/likes/post/${postId}`)
  if (!response.ok) throw new Error('Error obteniendo likes')
  return response.json()
}

export async function createLike(
  postId: string,
  userEmail: string,
  isLike: boolean
): Promise<void> {
  const response = await fetch(`${API_URL}/api/likes/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_id: postId,
      user_email: userEmail,
      is_like: isLike,
    }),
  })
  if (!response.ok) throw new Error('Error actualizando like')
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_URL}/api/auth/users`)
  if (!response.ok) throw new Error('Error obteniendo usuarios')
  return response.json()
}

export async function getProfile(identifier: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/profiles/${encodeURIComponent(identifier)}`)
  if (!response.ok) throw new Error('Error obteniendo perfil')
  return response.json()
}

export async function createProfile(email: string, username: string, avatarUrl: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/profiles/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      username,
      avatar_url: avatarUrl,
      onboarding_completed: true,
    }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = 'Error creando perfil'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

export interface UserStats {
  total_posts: number
  total_comments: number
  total_likes_received: number
  total_dislikes_received: number
}

export async function getUserStats(identifier: string): Promise<UserStats> {
  const response = await fetch(`${API_URL}/api/profiles/${encodeURIComponent(identifier)}/stats`)
  if (!response.ok) throw new Error('Error obteniendo estadísticas')
  return response.json()
}

export interface Message {
  id: string
  sender_email: string
  receiver_email: string
  content: string
  read: boolean
  created_at: string
  sender_username?: string | null
  sender_avatar_url?: string | null
  receiver_username?: string | null
  receiver_avatar_url?: string | null
}

export interface Conversation {
  email: string
  username?: string | null
  avatar_url?: string | null
  last_message_at: string
}

export async function getConversations(userEmail: string): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/api/messages/conversations?user_email=${encodeURIComponent(userEmail)}`)
  if (!response.ok) throw new Error('Error obteniendo conversaciones')
  return response.json()
}

export async function getConversation(userEmail: string, otherEmail: string): Promise<Message[]> {
  const response = await fetch(`${API_URL}/api/messages/conversation/${encodeURIComponent(otherEmail)}?user_email=${encodeURIComponent(userEmail)}`)
  if (!response.ok) throw new Error('Error obteniendo conversación')
  return response.json()
}

export async function sendMessage(senderEmail: string, receiverEmail: string, content: string): Promise<Message> {
  const response = await fetch(`${API_URL}/api/messages/?sender_email=${encodeURIComponent(senderEmail)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver_email: receiverEmail,
      content,
    }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = 'Error enviando mensaje'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

export async function markMessageAsRead(messageId: string, userEmail: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/messages/${messageId}/read?user_email=${encodeURIComponent(userEmail)}`, {
    method: 'PUT',
  })
  if (!response.ok) throw new Error('Error marcando mensaje como leído')
}

export async function getUnreadCount(userEmail: string): Promise<number> {
  const response = await fetch(`${API_URL}/api/messages/unread-count?user_email=${encodeURIComponent(userEmail)}`)
  if (!response.ok) throw new Error('Error obteniendo conteo de no leídos')
  const data = await response.json()
  return data.unread_count || 0
}

export async function updateProfile(email: string, username?: string, avatarUrl?: string): Promise<UserProfile> {
  const updateData: any = {}
  if (username !== undefined) updateData.username = username
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl

  const response = await fetch(`${API_URL}/api/profiles/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  })
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = 'Error actualizando perfil'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

