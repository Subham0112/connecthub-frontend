import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiBell, HiOutlineBell } from "react-icons/hi";
import api from "../lib/axiosInstance";
import { connectSocket } from "../lib/socket";
import { UserDataContext } from "../context/userContext";
import skeletonProfile from "../assets/img/skeleton_profile.jpg";

interface NotificationActor {
  id: number;
  user_name: string | null;
  profile_url?: string | null;
}

interface NotificationItem {
  id: number;
  recipient_id: number;
  actor_id: number;
  type: string;
  post_id: number | null;
  comment_id: number | null;
  message: string | null;
  is_read: boolean;
  created_at: string | null;
  actor: NotificationActor;
}

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const timeAgo = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

type NotificationBellProps = {
  variant?: "navbar" | "tab";
  placement?: "down" | "up";
};

const NotificationBell = ({
  variant = "navbar",
  placement = "down",
}: NotificationBellProps) => {
  const context = useContext(UserDataContext);
  const navigate = useNavigate();
  const isTab = variant === "tab";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const userId = context?.user?.id;

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications ?? []);
        setUnreadCount(res.data.unreadCount ?? 0);
      } catch (err) {
        console.log("Error fetching notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const socket = connectSocket(userId);

    const onReceived = (notification: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notification.id)) return prev;
        return [notification, ...prev];
      });

      if (openRef.current) {
        api.patch("/notifications/read-all").catch(() => undefined);
        socket.emit("notification_read", { userId });
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true }))
        );
      }
    };

    const onCount = (count: number) => {
      if (openRef.current) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true }))
        );
        return;
      }
      setUnreadCount(count);
      if (count === 0) {
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true }))
        );
      }
    };

    const onRemoved = () => {
      api
        .get("/notifications")
        .then((res) => {
          setNotifications(res.data.notifications ?? []);
          setUnreadCount(res.data.unreadCount ?? 0);
        })
        .catch(() => undefined);
    };

    socket.on("notification_received", onReceived);
    socket.on("notification_count", onCount);
    socket.on("notification_removed", onRemoved);

    return () => {
      socket.off("notification_received", onReceived);
      socket.off("notification_count", onCount);
      socket.off("notification_removed", onRemoved);
    };
  }, [userId]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    try {
      await api.patch("/notifications/read-all");
      if (userId) connectSocket(userId).emit("notification_read", { userId });
    } catch (err) {
      console.log("Error marking notifications read", err);
    }
  };

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      if (unreadCount > 0) await markAllRead();
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications ?? []);
        setUnreadCount(res.data.unreadCount ?? 0);
      } catch (err) {
        console.log("Error refreshing notifications", err);
      }
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    setOpen(false);
    if (notification.type === "like" || notification.type === "comment") {
      navigate("/dashboard");
      return;
    }
    navigate(`/users/${notification.actor_id}`);
  };

  return (
    <div ref={containerRef} className={isTab ? "relative flex-1" : "relative"}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className={`flex flex-col items-center gap-1 rounded-xl transition-colors duration-150 ${
          isTab
            ? `relative w-full px-1 py-2 ${open ? "text-sage-700" : "text-ink-400"}`
            : `p-2 ${
                open
                  ? "bg-sage-100 text-sage-700"
                  : "text-ink-300 hover:bg-ivory-100 hover:text-ink-800"
              }`
        }`}
      >
        {isTab && open && (
          <span className="absolute -top-[1px] left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-sage-600" />
        )}
        {open ? <HiBell size={22} /> : <HiOutlineBell size={22} />}
        <span
          className={`mt-0.5 text-[10px] font-semibold tracking-wide ${
            isTab ? "block text-[9.5px]" : "hidden lg:block"
          } ${open ? "text-sage-700" : isTab ? "text-ink-400" : "text-ink-300"}`}
        >
          Notifications
        </span>
      </button>

      {unreadCount > 0 && (
        <span
          className={`pointer-events-none absolute flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay-600 px-0.5 text-[9px] font-bold text-white ${
            isTab ? "left-1/2 top-1 ml-2" : "right-1.5 top-0.5"
          }`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {open && (
        <div
          className={`z-50 overflow-hidden rounded-2xl border border-ivory-400 bg-white shadow-lift animate-fade-in ${
            placement === "up"
              ? "fixed inset-x-2 bottom-[calc(60px+env(safe-area-inset-bottom))] w-auto"
              : "absolute right-0 top-full mt-2 w-[350px] max-w-[calc(100vw-2rem)]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-ivory-300 px-5 py-4">
            <div>
              <h3 style={serif} className="text-[16px] font-medium text-ink-900">
                Notifications
              </h3>
              <p className="mt-0.5 text-[11px] text-ink-400">
                Likes and comments on your posts
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-sage-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div
            className={`overflow-y-auto ${
              placement === "up" ? "max-h-[55vh]" : "max-h-[420px]"
            }`}
          >
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-2/3 rounded-full shimmer" />
                      <div className="h-2 w-1/3 rounded-full shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ivory-100 text-ink-300">
                  <HiOutlineBell size={20} />
                </div>
                <p style={serif} className="text-[15px] italic text-ink-500">
                  No notifications yet
                </p>
                <p className="mt-1.5 text-[11.5px] text-ink-400">
                  When someone likes or comments on your post, it will show up
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-ivory-300">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-ivory-50 ${
                      notification.is_read ? "bg-white" : "bg-sage-50/60"
                    }`}
                  >
                    <img
                      src={notification.actor?.profile_url || skeletonProfile}
                      alt={notification.actor?.user_name || "User"}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-ivory-400"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-relaxed text-ink-600">
                        <span className="font-bold text-ink-900">
                          {notification.actor?.user_name || "Someone"}
                        </span>{" "}
                        {notification.type === "like"
                          ? "liked your post."
                          : "commented on your post."}
                      </p>
                      {notification.type === "comment" &&
                        notification.message && (
                          <p className="mt-1 line-clamp-2 rounded-lg bg-ivory-100 px-2.5 py-1.5 text-[12px] italic text-ink-500">
                            “{notification.message}”
                          </p>
                        )}
                      <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-300">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
