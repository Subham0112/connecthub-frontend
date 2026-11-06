import { useEffect, useRef } from "react"
import { HiOutlineLogout, HiOutlineUser } from "react-icons/hi"
import skeletonProfile from "../assets/img/skeleton_profile.jpg"

type ProfileMenuUser = {
  user_name?: string | null
  email?: string | null
  profile_url?: string | null
}

const ProfileMenu = ({
  user,
  placement = "down",
  onViewProfile,
  onLogout,
  onClose,
}: {
  user: ProfileMenuUser
  placement?: "down" | "up"
  onViewProfile: () => void
  onLogout: () => void
  onClose: () => void
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={`z-50 w-60 animate-fade-in overflow-hidden rounded-2xl border border-ivory-400 bg-white shadow-lift ${
        placement === "up"
          ? "absolute bottom-full right-0 mb-2"
          : "absolute right-0 top-full mt-2"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-ivory-300 px-4 py-3">
        <img
          src={user.profile_url || skeletonProfile}
          alt={user.user_name || "Profile"}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-ivory-400"
        />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-ink-900">
            {user.user_name || "Profile"}
          </p>
          {user.email && (
            <p className="truncate text-[10.5px] text-ink-400">{user.email}</p>
          )}
        </div>
      </div>

      <div className="p-1.5">
        <button
          onClick={onViewProfile}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-ink-600 transition-colors hover:bg-ivory-100 hover:text-ink-900"
        >
          <HiOutlineUser size={17} />
          Show profile
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-ink-600 transition-colors hover:bg-clay-100 hover:text-clay-600"
        >
          <HiOutlineLogout size={17} />
          Logout
        </button>
      </div>
    </div>
  )
}

export default ProfileMenu
