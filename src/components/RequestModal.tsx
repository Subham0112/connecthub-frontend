import { useEffect, useRef, useState } from "react"
import FriendRequest from "./FriendRequest"
import SentRequestList from "./SentRequestList"

const RequestModal = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={dropdownRef}
      className="absolute right-5 top-[calc(100%+10px)] w-[360px] animate-scale-in overflow-hidden rounded-2xl border border-ivory-400 bg-white shadow-lift z-50"
    >
      {/* little caret pointing up at the nav button */}
      <div className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-t border-l border-ivory-400 bg-white" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2 className="font-display text-[17px] font-medium text-ink-900">Friend Requests</h2>
     
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
      <div className="max-h-[500px] overflow-y-auto p-3">
        {activeTab === "received" ? (
          <FriendRequest showRequest={activeTab === "received"} />
        ) : (
          <SentRequestList showSentRequests={activeTab === "sent"} />
        )}
      </div>
    </div>
  )
}

export default RequestModal