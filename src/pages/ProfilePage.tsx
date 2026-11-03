import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FaRegThumbsUp, FaThumbsUp, FaRegComment, FaCheck } from "react-icons/fa";
import {
  BsChatDots,
  BsFillPersonCheckFill,
  BsFillPersonXFill,
  BsEnvelopeFill,
  BsGlobe,
  BsLock,
  BsPersonFillAdd,
} from "react-icons/bs";
import { ImCross } from "react-icons/im";
import api from "../lib/axiosInstance";
import axios from "axios";
import { getSocket } from "../lib/socket";
import CommentModal from "../components/CommentModal";
import LikeModal from "../components/LikeModal";
import PostMedia from "../components/PostMedia";
import LikersSummary, { type PostLiker } from "../components/LikersSummary";
import { formatPostTime } from "../lib/postTime";
import type { AlertData } from "../components/Alert";
import Navbar from "../components/Navbar";
import { UserDataContext } from "../context/userContext";
import ConfirmModal from "../components/ConfirmModal";
import skeletonProfile from "../assets/img/skeleton_profile.jpg";

interface Media {
  media_id: number;
  post_id: number;
  user_id: number;
  filename: string;
  file_url: string;
}

interface UserData {
  id: number;
  user_name: string;
  email: string;
  profile_url?: string | null;
}

interface FriendRecord {
  friends_id: number;
  sender_id: number;
  receiver_id: number;
  friend_status: string;
  req_sender: UserData;
  req_receiver: UserData;
}

export interface PostData {
  id: number;
  user_id: number;
  content: string;
  visiblity: string;
  created_at?: string | null;
  media?: Media[];
  users?: UserData;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  likers?: PostLiker[];
}

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const SideCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="card-luxe p-5">
    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
      {title}
    </h3>
    {children}
  </div>
);

const StatStrip = ({ items }: { items: { label: string; value: number }[] }) => (
  <div className="flex items-center gap-6 sm:gap-10">
    {items.map((s, i) => (
      <div key={s.label} className="flex items-baseline gap-2">
        <span style={serif} className="text-[20px] font-medium leading-none text-ink-900">
          {s.value.toLocaleString()}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
          {s.label}
        </span>
        {i < items.length - 1 && <span className="ml-4 hidden h-4 w-px bg-ivory-300 sm:block" />}
      </div>
    ))}
  </div>
);

const ProfilePage = ({
  setAlert,
}: {
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
}) => {
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesPostId, setLikesPostId] = useState<number | null>(null);
  const [friendStatus, setFriendStatus] = useState<string>("none");
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const [profileFriends, setProfileFriends] = useState<FriendRecord[]>([]);
  const [showAllFriends, setShowAllFriends] = useState(false);

  const navigate = useNavigate();
  const context = useContext(UserDataContext);
  const { otherUserId } = useParams();
  const user_id = Number(otherUserId);

  const isOwnProfile = context?.user?.id === user_id;

  useEffect(() => {
    let cancelled = false;

    setProfileFriends([]);
    setShowAllFriends(false);

    const fetchUser = async () => {
      try {
        const res = await api.get(`/user/${user_id}`);
        if (!cancelled) setProfileUser(res.data.user);
      } catch (err) {
        console.log("Error fetching user", err);
      }
    };
    const fetchUserPosts = async () => {
      try {
        const res = await api.get(`/get-post/${user_id}`);
        if (!cancelled) setPosts(res.data.posts);
      } catch (err) {
        console.log("Error fetching posts", err);
      }
    };
    const fetchUserFriedsStatus = async () => {
      try {
        const res = await api.get(`/friend-status/${user_id}`);
        if (!cancelled) setFriendStatus(res.data.status);
      } catch (err) {
        console.log("Error fetching friend status", err);
      }
    };
    const fetchProfileFriends = async () => {
      try {
        const res = await api.get(`/userFriends/${user_id}`);
        if (!cancelled) setProfileFriends(res.data.friends ?? []);
      } catch (err) {
        console.log("Error fetching profile friends", err);
      }
    };
    if (otherUserId) {
      fetchUser();
      fetchUserPosts();
      fetchUserFriedsStatus();
      fetchProfileFriends();
    }

    return () => {
      cancelled = true;
    };
  }, [otherUserId, user_id]);

  // ── Realtime friend-status updates ────────────────────────────────────
  // The Add Friend / Cancel / Accept / Friends button changes instantly
  // when the OTHER user does something in their browser — no refresh needed.
  useEffect(() => {
    const socket = getSocket();
    const me = context?.user?.id;
    if (!socket || !me || !user_id) return;

    let active = true;

    const onAccepted = (data: { sender_id: number; receiver_id: number }) => {
      // I sent a request to this user and they accepted it
      if (data.sender_id === me && data.receiver_id === user_id) {
        setFriendStatus("friends");
      }
    };
    const onRejected = (data: { sender_id: number; receiver_id: number }) => {
      // I sent a request to this user and they rejected it
      if (data.sender_id === me && data.receiver_id === user_id) {
        setFriendStatus("none");
      }
    };
    const onReceived = (data: { sender_id: number; receiver_id: number }) => {
      // This user just sent ME a request (e.g. from another tab)
      if (data.sender_id === user_id && data.receiver_id === me) {
        setFriendStatus("pending_received");
      }
    };
    const onCancelled = (data: { sender_id: number; receiver_id: number }) => {
      // This user cancelled the request they sent me
      if (data.sender_id === user_id && data.receiver_id === me) {
        setFriendStatus("none");
      }
    };
    const onRemoved = (data: { user_id: number }) => {
      // This user unfriended me
      if (data.user_id === user_id) {
        setFriendStatus("none");
      }
    };
    const refreshFriends = async () => {
      try {
        const res = await api.get(`/userFriends/${user_id}`);
        if (active) setProfileFriends(res.data.friends ?? []);
      } catch (err) {
        console.log("Error refreshing profile friends", err);
      }
    };

    socket.on("friend_request_accepted", refreshFriends);
    socket.on("friend_removed", refreshFriends);
    socket.on("friend_request_accepted", onAccepted);
    socket.on("friend_request_rejected", onRejected);
    socket.on("friend_request_received", onReceived);
    socket.on("friend_request_cancelled", onCancelled);
    socket.on("friend_removed", onRemoved);
    return () => {
      active = false;
      socket.off("friend_request_accepted", refreshFriends);
      socket.off("friend_removed", refreshFriends);
      socket.off("friend_request_accepted", onAccepted);
      socket.off("friend_request_rejected", onRejected);
      socket.off("friend_request_received", onReceived);
      socket.off("friend_request_cancelled", onCancelled);
      socket.off("friend_removed", onRemoved);
    };
  }, [otherUserId, context?.user?.id, user_id]);

  const handleLikeToggle = async (postId: number) => {
    try {
      const res = await api.post(`/toggle-like/${postId}`, {});
      const liked = Boolean(res.data.liked);
      const me = context?.user;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const currentCount = post.likeCount ?? 0;
          const existing = post.likers ?? [];
          let likers = existing;

          if (liked && me && !existing.some((liker) => liker.id === me.id)) {
            likers = [
              {
                id: me.id,
                user_name: me.user_name,
                profile_url: me.profile_url,
              },
              ...existing,
            ].slice(0, 3);
          } else if (!liked) {
            likers = existing.filter((liker) => liker.id !== me?.id);
          }

          return {
            ...post,
            likers,
            likedByCurrentUser: liked,
            likeCount: liked ? currentCount + 1 : currentCount - 1,
          };
        })
      );
    } catch (err) {
      console.log("Error toggling like", err);
    }
  };

  const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);

  const handleAddClick = async (otherUserId: number) => {
    try {
      const res = await api.post(`/add-friend/${otherUserId}`, {});
      if (res.status === 200) {
        setFriendStatus("pending_sent");
        setAlert({
          type: "success",
          title: "Request Sent",
          message: res.data.message || "Friend request sent successfully.",
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          setAlert({ type: "error", title: "Request Failed", message: data.message });
          console.log("Error sending friend request", data.message);
          return;
        }
      }
      console.log("Error sending friend request", err);
      setAlert({ type: "error", title: "Request Failed", message: "Failed to send friend request." });
    }
  };

  const handleCancelRequest = async (otherUserId: number) => {
    try {
      const res = await api.delete(`/request-cancel/${otherUserId}`);
      if (res.status === 200) {
        setFriendStatus("none");
        setAlert({ type: "success", title: "Request Canceled", message: "Friend request canceled successfully." });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          setAlert({ type: "error", title: "Cancel Request Failed", message: data.message });
          return;
        }
      }
      setAlert({ type: "error", title: "Cancel Request Failed", message: "Failed to cancel friend request." });
    }
  };

  const handleAcceptRequest = async (otherUserId: number) => {
    try {
      const res = await api.patch(`/accept-request/${otherUserId}`, {});
      if (res.status === 200) {
        setFriendStatus("friends");
        setAlert({ type: "success", title: "Request Accepted", message: "Friend request accepted successfully." });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          setAlert({ type: "error", title: "Accept Request Failed", message: data.message });
          return;
        }
      }
      setAlert({ type: "error", title: "Accept Request Failed", message: "Failed to accept friend request." });
    }
  };

  const handleRejectRequest = async (otherUserId: number) => {
    try {
      const res = await api.delete(`/delete-request/${otherUserId}`);
      if (res.status === 200) {
        setFriendStatus("none");
        setAlert({ type: "success", title: "Request Rejected", message: "Friend request rejected successfully." });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          setAlert({ type: "error", title: "Reject Request Failed", message: data.message });
          return;
        }
      }
      setAlert({ type: "error", title: "Reject Request Failed", message: "Failed to reject friend request." });
    }
  };

  const handleUnfriend = async (otherUserId: number) => {
    try {
      const res = await api.delete(`/unfriend/${otherUserId}`);
      if (res.status === 200) {
        setFriendStatus("none");
        setAlert({ type: "success", title: "Unfriended", message: "You have unfriended this user." });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          setAlert({ type: "error", title: "Unfriend Failed", message: data.message });
          return;
        }
      }
      setAlert({ type: "error", title: "Unfriend Failed", message: "Failed to unfriend this user." });
    }
  };

  const avatar = profileUser?.profile_url || skeletonProfile;
  const otherFriends = Array.from(
    profileFriends
      .reduce((unique, record) => {
        const friend =
          record.sender_id === user_id ? record.req_receiver : record.req_sender;
        if (friend?.id != null) unique.set(friend.id, friend);
        return unique;
      }, new Map<number, UserData>())
      .values()
  );
  const visibleFriends = showAllFriends
    ? otherFriends
    : otherFriends.slice(0, 9);

  if (isOwnProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-ivory-100 text-ink-800">
      <Navbar />

      <div className="mx-auto max-w-[1080px] px-3 pb-24 pt-6 sm:px-6 sm:pt-8">
        {/* ════════ Profile header ════════ */}
        <div className="card-luxe mb-6 overflow-hidden rounded-3xl sm:mb-8">
          {/* Cover */}
          <div className="relative h-32 bg-gradient-to-br from-sage-200 via-sage-100 to-gold-100 sm:h-36">
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #7A9487 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
            <div className="absolute -left-10 -top-14 h-44 w-44 rounded-full bg-white/20 blur-md" />
            <div className="absolute -bottom-16 right-8 h-40 w-40 rounded-full bg-gold-500/20 blur-lg" />
          </div>

          {/* Identity — everything in normal flow, nothing can be cut */}
          <div className="px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Avatar + name */}
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={avatar}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = skeletonProfile;
                  }}
                  alt={profileUser?.user_name || "User"}
                  className="h-24 w-24 shrink-0 rounded-full bg-ivory-200 object-cover ring-4 ring-ivory-200 shadow-luxe"
                />
                <div className="min-w-0">
                  <h1
                    style={serif}
                    className="break-words text-[26px] font-medium leading-snug tracking-tight text-ink-900 sm:text-[30px]"
                  >
                    {profileUser?.user_name || "User"}
                  </h1>
                  <p className="mt-1.5 flex min-w-0 items-center gap-2 text-[13px] text-ink-400">
                    <BsEnvelopeFill size={13} className="shrink-0 text-sage-600" />
                    <span className="min-w-0 break-words">{profileUser?.email || ""}</span>
                  </p>
                </div>
              </div>

              {/* Actions — always rendered, never hidden */}
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={() => navigate(`/messages/${user_id}`)}
                  className="btn-primary px-5 py-2.5"
                >
                  <BsChatDots size={14} />
                  Message
                </button>
                {friendStatus === "none" && (
                  <button
                    onClick={() => handleAddClick(user_id)}
                    className="btn-sage px-5 py-2.5"
                  >
                    <BsPersonFillAdd size={14} />
                    Add Friend
                  </button>
                )}
                {friendStatus === "pending_sent" && (
                  <button
                    onClick={() => handleCancelRequest(user_id)}
                    className="btn-outline px-5 py-2.5"
                  >
                    <BsFillPersonXFill size={14} />
                    Cancel Request
                  </button>
                )}
                {friendStatus === "pending_received" && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => handleAcceptRequest(user_id)}
                      className="btn-sage px-5 py-2.5"
                    >
                      <FaCheck size={13} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(user_id)}
                      className="btn-outline px-5 py-2.5 hover:border-clay-500/50 hover:bg-clay-100 hover:text-clay-600"
                    >
                      <ImCross size={12} />
                      Decline
                    </button>
                  </div>
                )}
                {friendStatus === "friends" && (
                  <button
                    onClick={() => setShowUnfriendModal(true)}
                    className="btn-outline px-5 py-2.5"
                  >
                    <BsFillPersonCheckFill size={14} />
                    Friends
                  </button>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-6 border-t border-ivory-300 pt-5">
              <StatStrip
                items={[
                  { label: "Posts", value: posts.length },
                  { label: "Likes", value: totalLikes },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ════════ Body: two columns ════════ */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Left column — scrolls naturally with the page */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            <SideCard title="Friends preview">
              {otherFriends.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-ink-400">
                  No friends to show yet.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {visibleFriends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => navigate(`/users/${friend.id}`)}
                        className="group cursor-pointer overflow-hidden rounded-xl bg-ivory-100 transition-all duration-200 hover:shadow-luxe"
                      >
                        <img
                          src={friend.profile_url || skeletonProfile}
                          alt={friend.user_name}
                          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                  {otherFriends.length > 9 && (
                    <button
                      onClick={() => setShowAllFriends((current) => !current)}
                      className="mt-3 w-full rounded-xl bg-ivory-100 py-2 text-[12.5px] font-bold text-sage-700 transition-colors duration-150 hover:bg-sage-100"
                    >
                      {showAllFriends
                        ? "Show less"
                        : `View all ${otherFriends.length} friends`}
                    </button>
                  )}
                </>
              )}
            </SideCard>
          </aside>

          {/* Right column — posts */}
          <main className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
                Posts
              </h3>
              <span className="chip bg-ivory-200 text-ink-500">{posts.length} total</span>
            </div>

            {posts.length === 0 ? (
              <div className="card-luxe p-12 text-center">
                <p style={serif} className="mb-2 text-lg italic text-ink-500">
                  No posts yet
                </p>
                <p className="text-[13px] text-ink-400">
                  {profileUser?.user_name || "This member"} hasn't shared anything yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map((post) => (
                  <div key={post.id} className="card-luxe overflow-hidden">
                    {/* Post header */}
                    <div className="flex items-center gap-3 px-6 pt-6 pb-4 sm:px-7">
                      <img
                        src={avatar}
                        alt={profileUser?.user_name}
                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-ivory-400"
                      />
                      <div className="min-w-0">
                        <p style={serif} className="truncate text-[15px] font-medium text-ink-900">
                          {post.users?.user_name}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {post.visiblity === "all" ? (
                            <BsGlobe className="shrink-0 text-ink-300" size={12} />
                          ) : (
                            <BsLock className="shrink-0 text-ink-300" size={12} />
                          )}
                          
                          {post.created_at && (
                            <>
                              <span className="text-ink-300">·</span>
                              <span className="text-[10px] font-medium text-ink-400">
                                {formatPostTime(post.created_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <div className="px-6 pb-4 sm:px-7">
                        <p className="text-[14.5px] leading-relaxed text-ink-700 whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Media */}
                    <PostMedia media={post.media} />

                    <LikersSummary
                      likers={post.likers}
                      likeCount={post.likeCount}
                      isOwnPost={post.user_id === context?.user?.id}
                      onOpen={() => {
                        setLikesPostId(post.id);
                        setShowLikesModal(true);
                      }}
                    />

                    {/* Actions */}
                    <div className="flex items-center border-t border-ivory-300 px-4 py-1">
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold transition-colors duration-150 ${
                          post.likedByCurrentUser
                            ? "bg-sage-100 text-sage-700"
                            : "text-ink-500 hover:bg-ivory-100 hover:text-ink-900"
                        }`}
                      >
                        {post.likedByCurrentUser ? <FaThumbsUp size={13} /> : <FaRegThumbsUp size={13} />}
                        {post.likeCount > 0 ? (
                          <span>{post.likeCount} Like</span>
                        ) : (
                          <span>Like</span>
                        )}
                      </button>

                      <div className="h-5 w-px bg-ivory-300" />

                      <button
                        onClick={() => { setSelectedPost(post); setShowCommentModal(true); }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-ivory-100 hover:text-ink-900"
                      >
                        <FaRegComment size={13} />
                        <span>{post.commentCount > 0 ? post.commentCount : ""} Comment</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Modals */}
        {showUnfriendModal && (
          <ConfirmModal
            title="Unfriend"
            message={`Are you sure you want to unfriend ${profileUser?.user_name || "this user"}? You'll no longer see each other's posts as friends.`}
            confirmLabel="Unfriend"
            loading={false}
            onConfirm={() => handleUnfriend(user_id)}
            onClose={() => setShowUnfriendModal(false)}
          />
        )}
        {showCommentModal && selectedPost && (
          <CommentModal
            postId={selectedPost?.id}
            setAlert={setAlert}
            onCommentAdded={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1 } : p
                )
              )
            }
            onCommentDelete={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === selectedPost.id ? { ...p, commentCount: p.commentCount - 1 } : p
                )
              )
            }
            onClose={() => setShowCommentModal(false)}
          />
        )}
        {showLikesModal && likesPostId !== null && (
          <LikeModal
            postId={likesPostId}
            likeCount={posts.find((p) => p.id === likesPostId)?.likeCount ?? 0}
            onClose={() => { setShowLikesModal(false); setLikesPostId(null); }}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;