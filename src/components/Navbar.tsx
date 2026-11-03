import React, { useContext, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { UserDataContext } from "../context/userContext"
import { HiHome, HiOutlineHome } from "react-icons/hi"
import { IoChatbubbleOutline, IoChatbubble } from "react-icons/io5"
import { HiUserGroup, HiOutlineUserGroup } from "react-icons/hi"
import { BsSearch } from "react-icons/bs"
import RequestModal from "./RequestModal"

import { HiOutlineLogout } from "react-icons/hi"
import ConfirmModal from "./ConfirmModal"
import SearchBar from "./SearchBar"
import NotificationBell from "./NotificationBell"
import skeletonProfile from "../assets/img/skeleton_profile.jpg"
import { connectSocket, disconnectSocket } from "../lib/socket"

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const context = useContext(UserDataContext)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [showRequestModal, setShowRequestModal] = useState(false)
const [pendingRequestCount, setPendingRequestCount] = useState(0)


useEffect(() => {
  if (!context?.user?.id) return

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API}/friend-request`,
        { withCredentials: true }
      )
      setPendingRequestCount(res.data.friendRequest?.length ?? 0)
    } catch (err) {
      console.log("Error fetching pending requests", err)
    }
  }
  fetchPendingRequests()
}, [context?.user?.id])
  
 useEffect(() => {
    if (!context?.user?.id) {
      disconnectSocket()
      return
    }

    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/total-unread`, {
          withCredentials: true,
        })
        setTotalUnread(res.data.count)
      } catch (err) {
        console.log("Error fetching unread count", err)
      }
    }
    fetchUnread()

    const socket = connectSocket(context.user.id)
    socket.emit("join", context.user.id)

    // Server pushes the authoritative unread-conversation count whenever
    // it changes (new message, chat marked as read, etc.)
    const onTotalUnreadCount = (count: number) => setTotalUnread(count)
    // Fallback: message arrived → ask the server for the true count
    const onReceiveMessage = () => {
      if (!location.pathname.startsWith("/messages")) {
        fetchUnread()
      }
    }
    // Realtime friend-request badge sync (server sends the authoritative count)
    const onFriendRequestCount = (count: number) => setPendingRequestCount(count)
    // Fallbacks in case the count event is missed (e.g. opened on another tab)
    const onFriendRequestReceived = () => setPendingRequestCount((n) => n + 1)
    const onFriendRequestCancelled = () =>
      setPendingRequestCount((n) => (n > 0 ? n - 1 : 0))

    socket.on("total_unread_count", onTotalUnreadCount)
    socket.on("receive_message", onReceiveMessage)
    socket.on("friend_request_count", onFriendRequestCount)
    socket.on("friend_request_received", onFriendRequestReceived)
    socket.on("friend_request_cancelled", onFriendRequestCancelled)

    return () => {
      socket.off("total_unread_count", onTotalUnreadCount)
      socket.off("receive_message", onReceiveMessage)
      socket.off("friend_request_count", onFriendRequestCount)
      socket.off("friend_request_received", onFriendRequestReceived)
      socket.off("friend_request_cancelled", onFriendRequestCancelled)
    }
  }, [context?.user?.id])

  // Re-fetch the true unread count whenever the route changes — opening a
  // chat marks its messages as read, so coming back must refresh the badge
  // (e.g. 2 unread conversations → open one → badge should show 1)
  useEffect(() => {
    if (!context?.user?.id) return
    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/total-unread`, {
          withCredentials: true,
        })
        setTotalUnread(res.data.count)
      } catch (err) {
        console.log("Error fetching unread count", err)
      }
    }
    fetchUnread()
  }, [location.pathname, context?.user?.id])

  if (!context) return null
  const { setUser, user } = context

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/logout`,
        {},
        { withCredentials: true }
      )
      console.log(res.data.message)
      disconnectSocket()
      setUser({ id: 0, email: "", role: null, user_name: "", profile_url: null })
      navigate("/login")
    } catch (err) {
      console.error("Error logging out", err)
    } finally {
      setLoggingOut(false)
    }
  }

  const isActive = (path: string) => location.pathname === path



  return (
    <nav className="sticky top-0 z-40 w-full border-b border-ivory-400/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center gap-2 px-4 sm:gap-3 sm:px-6">

        {/* Logo */}
        <div
          onClick={() => navigate("/homepage")}
          className="flex shrink-0 cursor-pointer select-none items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 shadow-sm">
            <span style={serif} className="text-[13px] font-medium text-white">CH</span>
          </div>
          <span style={serif} className="hidden text-lg font-medium tracking-tight text-ink-900 sm:inline">ConnectHub</span>
        </div>

        {/* Search — left side on desktop, icon on mobile */}
        <div className="hidden min-w-0 flex-1 md:block md:max-w-[240px] lg:max-w-[340px]">
          <SearchBar />
        </div>

        {/* Main nav — Home, Messages, Profile, Requests all on the left */}
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => navigate("/search")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ivory-100 hover:text-ink-800 md:hidden"
            aria-label="Search"
          >
            <BsSearch size={17} />
          </button>

          <NavButton
            onClick={() => navigate("/homepage")}
            active={isActive("/homepage")}
            icon={isActive("/homepage") ? <HiHome size={20} /> : <HiOutlineHome size={20} />}
            label="Home"
          />

          <div className="relative">
            <NavButton
              onClick={() => navigate("/messages")}
              active={location.pathname.startsWith("/messages")}
              icon={location.pathname.startsWith("/messages") ? <IoChatbubble size={18} /> : <IoChatbubbleOutline size={18} />}
              label="Messages"
            />
            {totalUnread > 0 && (
              <span className="absolute right-1 top-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-clay-600 px-0.5 text-[9px] font-bold text-white pointer-events-none">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>

         
        </div>

        {/* Notifications + Logout on the right */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <NotificationBell />
           <button
            onClick={() => navigate("/dashboard")}
            className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors duration-150 hover:bg-ivory-100 sm:px-3"
          >
            <img
              src={user.profile_url || skeletonProfile}
              alt={user.user_name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-ivory-400"
            />
            <span className="hidden text-[10px] font-medium tracking-wide text-ink-300 group-hover:text-ink-600 lg:block">
              Profile
            </span>
          </button>

          <div className="relative">
            <NavButton
              onClick={() => setShowRequestModal(!showRequestModal)}
              active={showRequestModal}
              icon={showRequestModal ? <HiUserGroup size={18} /> : <HiOutlineUserGroup size={18} />}
              label="Requests"
            />
            {pendingRequestCount > 0 && (
              <span className="absolute right-1 top-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-gold-600 px-0.5 text-[9px] font-bold text-white pointer-events-none">
                {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={loggingOut}
            className="ml-1 flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-semibold text-ink-400 transition-colors duration-150 hover:bg-clay-100 hover:text-clay-600 sm:px-3"
          >
            <HiOutlineLogout size={16} />
            <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Logout"}</span>
          </button>
        </div>

      </div>
      {showRequestModal && (
        <RequestModal onClose={() => setShowRequestModal(false)} />
      )}
      {showLogoutModal &&
        createPortal(
          <ConfirmModal
            title="Log out"
            message="Are you sure you want to log out of ConnectHub? You'll need to sign in again to continue."
            confirmLabel="Log out"
            loading={loggingOut}
            onConfirm={handleLogout}
            onClose={() => setShowLogoutModal(false)}
          />,
          document.body
        )}
    </nav>
  )
}

const NavButton = ({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void
  active: boolean
  icon: React.ReactNode
  label: string
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors duration-150 sm:px-3 lg:px-4
      ${
        active
          ? "bg-sage-100 text-sage-700"
          : "text-ink-300 hover:bg-ivory-100 hover:text-ink-800"
      }`}
  >
    {icon}
    <span className={`hidden text-[10px] font-semibold tracking-wide lg:block ${active ? "text-sage-700" : "text-ink-300"}`}>
      {label}
    </span>
  </button>
)

export default Navbar