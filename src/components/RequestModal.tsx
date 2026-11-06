import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { HiX } from "react-icons/hi"
import FriendRequest from "./FriendRequest"
import SentRequestList from "./SentRequestList"

const RequestModal = ({
  onClose,
  variant = "dropdown",
}: {
  onClose: () => void
  variant?: "dropdown" | "sheet"
}) => {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2 className="font-display text-[17px] font-medium text-ink-900">Friend Requests</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ivory-100 hover:text-ink-800"
        >
          <HiX size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ivory-300 px-4">
        <button
          onClick={() => setActiveTab("received")}
          className={`relative px-3 py-2.5 text-[13px] font-semibold transition-colors duration-150 ${
            activeTab === "received"
              ? "text-sage-700"
              : "text-ink-300 hover:text-ink-600"
          }`}
        >
          Requests
          {activeTab === "received" && (
            <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-sage-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`relative px-3 py-2.5 text-[13px] font-semibold transition-colors duration-150 ${
            activeTab === "sent"
              ? "text-sage-700"
              : "text-ink-300 hover:text-ink-600"
          }`}
        >
          Sent Requests
          {activeTab === "sent" && (
            <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-sage-600" />
          )}
        </button>
      </div>

      {/* Body */}
      <div
        className={`overflow-y-auto p-3 ${
          variant === "sheet" ? "max-h-[60vh]" : "max-h-[500px]"
        }`}
      >
        {activeTab === "received" ? (
          <FriendRequest showRequest={activeTab === "received"} />
        ) : (
          <SentRequestList showSentRequests={activeTab === "sent"} />
        )}
      </div>
    </>
  )

  if (variant === "sheet") {
    return createPortal(
      <div
        className="fixed inset-0 z-50 bg-ink-900/40 md:hidden"
        onMouseDown={onClose}
      >
        <div
          ref={dropdownRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 animate-fade-up overflow-hidden rounded-t-2xl border-t border-ivory-400 bg-white shadow-lift"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ivory-500" />
          {content}
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-5 top-[calc(100%+10px)] z-50 w-[360px] animate-scale-in overflow-hidden rounded-2xl border border-ivory-400 bg-white shadow-lift"
    >
      {content}
    </div>
  )
}

export default RequestModal
