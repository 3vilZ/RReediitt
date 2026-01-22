'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getUsers, User, getConversations, Conversation, getConversation, sendMessage, Message, getUnreadCount, markMessageAsRead, getProfile } from '@/lib/api'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  // Refs para mantener valores actualizados en los callbacks de Realtime
  const selectedUserRef = useRef<User | null>(null)
  const currentUserEmailRef = useRef<string | null>(null)

  useEffect(() => {
    console.log('[ChatWidget] Componente montado, verificando usuario...')
    checkUser()
  }, [])

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    currentUserEmailRef.current = currentUserEmail
  }, [currentUserEmail])

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  useEffect(() => {
    if (currentUserEmail) {
      loadUsers()
      loadConversations()
      loadUnreadCount()
    }
  }, [currentUserEmail])

  useEffect(() => {
    if (selectedUser && currentUserEmail) {
      loadMessages()
    }
  }, [selectedUser, currentUserEmail])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  const checkUser = async () => {
    try {
      console.log('[ChatWidget] Verificando autenticación...')
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('[ChatWidget] Error obteniendo usuario:', error)
        setCurrentUserEmail(null)
      } else {
        console.log('[ChatWidget] Usuario encontrado:', user?.email || 'ninguno')
        setCurrentUserEmail(user?.email || null)
      }
    } catch (error) {
      console.error('[ChatWidget] Error verificando usuario:', error)
      setCurrentUserEmail(null)
    } finally {
      setCheckingAuth(false)
      console.log('[ChatWidget] Verificación de autenticación completada')
    }
  }

  const loadUsers = async () => {
    if (!currentUserEmail) return
    try {
      const usersList = await getUsers()
      // Filtrar el usuario actual
      const filteredUsers = (usersList || []).filter(user => user.email !== currentUserEmail)
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      // En caso de error, establecer lista vacía
      setUsers([])
    }
  }

  const loadConversations = async () => {
    if (!currentUserEmail) return
    try {
      const convs = await getConversations(currentUserEmail)
      setConversations(convs)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
    }
  }

  const loadMessages = async () => {
    if (!selectedUser || !currentUserEmail) return
    setLoading(true)
    try {
      const msgs = await getConversation(currentUserEmail, selectedUser.email)
      setMessages(msgs)
      
      // Marcar mensajes no leídos como leídos
      const unreadMessages = msgs.filter(msg => !msg.read && msg.receiver_email === currentUserEmail)
      for (const msg of unreadMessages) {
        try {
          await markMessageAsRead(msg.id, currentUserEmail)
        } catch (error) {
          console.error('Error marcando mensaje como leído:', error)
        }
      }
      
      loadUnreadCount()
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!currentUserEmail) return
    try {
      const count = await getUnreadCount(currentUserEmail)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error cargando conteo de no leídos:', error)
    }
  }

  // Función para enriquecer un mensaje con información del perfil
  const enrichMessageWithProfile = async (messageData: any): Promise<Message> => {
    try {
      // Obtener perfiles del remitente
      const senderEmail = messageData.sender_email
      const profile = await getProfile(senderEmail)
      messageData.sender_username = profile.username
      messageData.sender_avatar_url = profile.avatar_url
    } catch (error) {
      console.error('Error enriqueciendo mensaje con perfil:', error)
      // Continuar sin enriquecer si hay error
    }
    return messageData as Message
  }

  // Función para agregar un nuevo mensaje al estado
  const addMessageToState = async (messageData: any) => {
    const enrichedMessage = await enrichMessageWithProfile(messageData)
    setMessages((prevMessages) => {
      // Evitar duplicados
      if (prevMessages.some(msg => msg.id === enrichedMessage.id)) {
        return prevMessages
      }
      // Agregar el nuevo mensaje y ordenar por fecha
      const updated = [...prevMessages, enrichedMessage]
      return updated.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })
  }

  // Suscripción de Realtime con cleanup correcto
  useEffect(() => {
    if (!currentUserEmailRef.current) return

    const userEmail = currentUserEmailRef.current
    console.log('[ChatWidget] Configurando suscripción Realtime para:', userEmail)

    // Crear un canal único para este usuario
    const channelName = `messages-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_email=eq.${userEmail}`,
        },
        async (payload) => {
          console.log('[ChatWidget] Mensaje recibido vía Realtime:', payload.new)
          const newMessage = payload.new
          
          // Actualizar conteo de no leídos
          loadUnreadCount()
          
          // Verificar si estamos viendo la conversación con el remitente
          const currentSelectedUser = selectedUserRef.current
          if (currentSelectedUser && newMessage.sender_email === currentSelectedUser.email) {
            // Si estamos viendo esta conversación, agregar el mensaje directamente
            await addMessageToState(newMessage)
            
            // Marcar como leído
            try {
              await markMessageAsRead(newMessage.id, userEmail)
            } catch (error) {
              console.error('Error marcando mensaje como leído:', error)
            }
          } else {
            // Si no, solo actualizar conversaciones
            loadConversations()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_email=eq.${userEmail}`,
        },
        async (payload) => {
          console.log('[ChatWidget] Mensaje enviado vía Realtime:', payload.new)
          const newMessage = payload.new
          
          // Verificar si estamos viendo la conversación con el destinatario
          const currentSelectedUser = selectedUserRef.current
          if (currentSelectedUser && newMessage.receiver_email === currentSelectedUser.email) {
            // Si estamos viendo esta conversación, agregar el mensaje directamente
            await addMessageToState(newMessage)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[ChatWidget] Estado de suscripción:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[ChatWidget] Suscripción Realtime activa correctamente')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ChatWidget] Error en el canal de Realtime:', err)
        } else if (status === 'TIMED_OUT') {
          console.error('[ChatWidget] Timeout en la suscripción Realtime')
        } else if (status === 'CLOSED') {
          console.warn('[ChatWidget] Canal de Realtime cerrado')
        }
      })

    // Cleanup: remover el canal cuando el componente se desmonte o cambien las dependencias
    return () => {
      console.log('[ChatWidget] Limpiando suscripción Realtime')
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [currentUserEmail]) // Solo recrear cuando cambie currentUserEmail

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageContent.trim() || !selectedUser || !currentUserEmail || sending) return

    setSending(true)
    try {
      const newMessage = await sendMessage(currentUserEmail, selectedUser.email, messageContent.trim())
      setMessageContent('')
      // El mensaje se agregará automáticamente vía Realtime, pero lo agregamos también aquí
      // para evitar retrasos en la UI
      await addMessageToState(newMessage)
    } catch (error: any) {
      console.error('Error enviando mensaje:', error)
      alert(error.message || 'Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user)
    setIsUserDropdownOpen(false)
    // Buscar si ya existe una conversación con este usuario
    const existingConv = conversations.find(c => c.email === user.email)
    if (!existingConv) {
      // Si no existe, crear una entrada en conversaciones
      setConversations([...conversations, {
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        last_message_at: new Date().toISOString()
      }])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes}m`
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)}h`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // No mostrar nada mientras se verifica la autenticación
  if (checkingAuth) {
    console.log('[ChatWidget] Esperando verificación de autenticación...')
    return null
  }

  // Si no hay usuario autenticado, no mostrar el chat
  if (!currentUserEmail) {
    console.log('[ChatWidget] No hay usuario autenticado, no se muestra el chat')
    return null
  }

  console.log('[ChatWidget] Renderizando chat para usuario:', currentUserEmail)

  return (
    <>
       {/* Botón flotante - solo se muestra cuando el chat está cerrado */}
       {!isOpen && (
         <button
           onClick={() => setIsOpen(true)}
           className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50 transition"
           aria-label="Abrir chat"
         >
           <span className="text-2xl">💬</span>
         </button>
       )}

      {/* Widget de chat - solo se muestra cuando el chat está abierto */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 border-b border-gray-700 p-4 rounded-t-lg flex items-center justify-between">
            <h3 className="text-white font-semibold">Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* Selector de usuario */}
          <div className="px-4 pt-4 pb-4 border-b border-gray-700 relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-3 hover:bg-gray-600 transition"
            >
              {selectedUser ? (
                <>
                  {selectedUser.avatar_url ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedUser.avatar_url}
                        alt={selectedUser.username || selectedUser.email || 'Usuario'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-300 text-xs font-semibold">
                        {(selectedUser.username || selectedUser.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="flex-1 text-left">
                    {selectedUser.username || selectedUser.email}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-left text-gray-400">Seleccionar usuario...</span>
              )}
              <span className={`transform transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isUserDropdownOpen && (
              <div className="absolute z-50 left-4 right-4 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg max-h-64 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400 text-sm">No hay usuarios</div>
                ) : (
                  users.map((user) => {
                    const displayName = user.username || user.email
                    return (
                      <button
                        key={user.email}
                        onClick={() => handleUserSelect(user)}
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

          {/* Área de mensajes */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {loading ? (
              <div className="text-gray-400 text-center">Cargando...</div>
            ) : selectedUser ? (
              messages.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No hay mensajes. ¡Envía el primero!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_email === currentUserEmail
                  // Siempre mostrar el avatar y nombre del remitente (quien envió el mensaje)
                  const displayName = message.sender_username || message.sender_email
                  const displayAvatar = message.sender_avatar_url

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
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
                          <span className="text-gray-300 text-xs font-semibold">
                            {(displayName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )
            ) : (
              <div className="text-gray-400 text-center py-8">
                Selecciona un usuario para comenzar a chatear
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensaje */}
          {selectedUser && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!messageContent.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  )
}

