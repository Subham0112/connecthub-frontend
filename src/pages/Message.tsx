import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/axiosInstance'
import { connectSocket } from '../lib/socket'
import type { AlertData } from '../components/Alert'
import Navbar from '../components/Navbar'
import { UserDataContext } from '../context/userContext'
import { BsSearch } from 'react-icons/bs'
import { IoChatbubbleOutline } from 'react-icons/io5'

interface ConversationData {
  userId: number;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  profile_url?: string | null;
  unreadCount: number;
}

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "?"

const getAvatarColor = (name?: string) => {
  const colors = [
    "bg-ivory-200 text-ink-600",
    "bg-sage-100 text-sage-700",
    "bg-gold-50 text-gold-700",
    "bg-ivory-300 text-ink-700",
    "bg-clay-100 text-clay-600",
    "bg-sage-50 text-sage-600",
  ]
  if (!name) return colors[0]
  return colors[name.charCodeAt(0) % colors.length]
}

const ConvAvatar = ({ name, profileUrl, size = "md" }: { name: string; profileUrl?: string | null; size?: "md" | "lg" }) => {
  const cls = size === "lg" ? "h-[52px] w-[52px] text-[15px]" : "h-11 w-11 text-[13px]"
  if (profileUrl) {
    return (
      <img
        src={profileUrl}
        alt={name}
        className={`${size === "lg" ? "h-[52px] w-[52px]" : "h-11 w-11"} shrink-0 rounded-full object-cover ring-1 ring-ivory-400`}
      />
    )
  }
  return (
    <div className={`${cls} shrink-0 rounded-full flex items-center justify-center font-semibold ${getAvatarColor(name)}`}>
      {getInitials(name)}
    </div>
  )
}

const Messages = ({ setAlert }: { setAlert: React.Dispatch<React.SetStateAction<AlertData | null>> }) => {
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [query, setQuery] = useState<string>("")
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const navigate = useNavigate()
  const location = useLocation()
  const context = useContext(UserDataContext)
  const currentUserId = context?.user?.id

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/get-conversation`)
      setConversations(res.data.data)
    } catch (err) {
      console.log("Error fetching conversations", err)
      setAlert({ type: 'error', title: 'Failed to load messages', message: 'Could not fetch your conversations.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  
  useEffect(() => {
    const match = location.state?.clearedUserId
    if (match) {
      setConversations((prev) =>
        prev.map((c) => c.userId === match ? { ...c, unreadCount: 0 } : c)
      )
    }
  }, [location.state])

  useEffect(() => {
    if (!currentUserId) return

    const socket = connectSocket(currentUserId)

    const handleReceiveMessage = (message: {
      sender_id: number
      messages: string
      created_at: string
    }) => {
      if (message.sender_id === currentUserId) return

      setConversations((prev) => {
        const exists = prev.find((c) => c.userId === message.sender_id)

        if (exists) {
          const updated = prev.map((c) =>
            c.userId === message.sender_id
              ? {
                  ...c,
                  lastMessage: message.messages,
                  lastMessageAt: message.created_at,
                  unreadCount: c.unreadCount + 1,
                }
              : c
          )
          return [
            updated.find((c) => c.userId === message.sender_id)!,
            ...updated.filter((c) => c.userId !== message.sender_id),
          ]
        }

        
        fetchConversations()
        return prev
      })
    }

    socket.on("receive_message", handleReceiveMessage)

    return () => {
      socket.off("receive_message", handleReceiveMessage)
    }
  }, [currentUserId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const sameYear = date.getFullYear() === now.getFullYear()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    if (sameYear) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
  }

  const handleOpenChat = (userId: number) => {
    setConversations((prev) =>
      prev.map((c) => c.userId === userId ? { ...c, unreadCount: 0 } : c)
    )
    navigate(`/messages/${userId}`)
  }

  const unreadCount = conversations.reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0)

  const normalized = query.trim().toLowerCase()
  const visible = conversations.filter((c) => {
    const matchesQuery = !normalized || c.name.toLowerCase().includes(normalized)
    const matchesFilter = filter === "all" || c.unreadCount > 0
    return matchesQuery && matchesFilter
  })

  return (
    <div className="min-h-screen bg-ivory-100 text-ink-800">
      <Navbar />

      <div className="mx-auto max-w-[640px] px-4 pt-8 pb-24 sm:px-6">
        <div className="card-luxe overflow-hidden">

          {/* Header */}
          <div className="px-6 py-6 sm:px-7">
            <div className="flex items-start justify-between">
              <div>
                <h1 style={serif} className="text-[22px] font-medium text-ink-900">Messages</h1>
                <p className="mt-0.5 text-[12.5px] text-ink-400">Your recent conversations</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <IoChatbubbleOutline size={18} />
              </div>
            </div>

            {/* Search */}
            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-ivory-300 bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
              <BsSearch className="shrink-0 text-ink-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search conversations…"
                className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
              />
            </div>

            {/* Filters */}
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors duration-150 ${
                  filter === "all"
                    ? "bg-ink-900 text-white"
                    : "bg-ivory-100 text-ink-500 hover:bg-ivory-200"
                }`}
              >
                All chats
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors duration-150 ${
                  filter === "unread"
                    ? "bg-ink-900 text-white"
                    : "bg-ivory-100 text-ink-500 hover:bg-ivory-200"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] ${
                    filter === "unread" ? "bg-white/20" : "bg-sage-700 text-white"
                  }`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col gap-4 border-t border-ivory-300 px-7 py-7">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-full shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-2.5 w-1/3 rounded-full shimmer" />
                    <div className="h-2.5 w-2/3 rounded-full shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="border-t border-ivory-300 px-7 py-20 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ivory-100 text-ink-300">
                <IoChatbubbleOutline size={26} />
              </div>
              <p style={serif} className="text-lg italic text-ink-500">No conversations yet</p>
              <p className="mt-2 text-[12.5px] text-ink-400">
                Visit someone's profile and tap Message to start a chat
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="border-t border-ivory-300 px-7 py-16 text-center">
              <p style={serif} className="text-base italic text-ink-500">
                {filter === "unread" ? "You're all caught up" : `Nothing matches “${query}”`}
              </p>
              <p className="mt-1.5 text-[12.5px] text-ink-400">
                {filter === "unread"
                  ? "No unread conversations right now."
                  : "Try a different name or clear the search."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ivory-300">
              {visible.map((conv) => (
                <div
                  key={conv.userId}
                  onClick={() => handleOpenChat(conv.userId)}
                  className={`group flex items-center gap-4 px-5 py-4 transition-colors duration-150 sm:px-7 ${
                    conv.unreadCount > 0
                      ? "bg-sage-50/70 hover:bg-sage-50"
                      : "hover:bg-ivory-100"
                  }`}
                >
                  <div className="relative shrink-0">
                    <ConvAvatar name={conv.name} profileUrl={conv.profile_url} size="lg" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-sage-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span style={serif} className={`truncate text-[15px] ${
                        conv.unreadCount > 0 ? "font-semibold text-ink-900" : "font-medium text-ink-700"
                      }`}>
                        {conv.name}
                      </span>
                      <span className={`shrink-0 text-[11px] font-semibold ${
                        conv.unreadCount > 0 ? "text-sage-700" : "text-ink-300"
                      }`}>
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className={`truncate text-[13px] leading-relaxed ${
                        conv.unreadCount > 0 ? "font-semibold text-ink-700" : "text-ink-400"
                      }`}>
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-sage-700 px-1.5 text-[10.5px] font-bold text-white">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages