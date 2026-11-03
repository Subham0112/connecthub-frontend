import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { BsGlobe, BsLock, BsChatDots } from "react-icons/bs";
import type { AlertData } from "../components/Alert";
import CommentModal from "../components/CommentModal";
import LikesModal from "../components/LikeModal";
import PostModal from "../components/PostModal";
import PostMedia from "../components/PostMedia";
import LikersSummary, { type PostLiker } from "../components/LikersSummary";
import { formatPostTime } from "../lib/postTime";
import { FaThumbsUp, FaRegThumbsUp, FaRegComment } from "react-icons/fa";
import {
  HiOutlineUser,
  HiOutlinePencilAlt,
  HiOutlinePhotograph,
} from "react-icons/hi";
import { UserDataContext } from "../context/userContext";
import skeletonProfile from "../assets/img/skeleton_profile.jpg";
import api from "../lib/axiosInstance";
import { getSocket } from "../lib/socket";

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
  score?: number;
}

interface FriendUser {
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
  req_sender: FriendUser;
  req_receiver: FriendUser;
}

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const HomePage = ({
  setAlert,
}: {
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
}) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [showLikesModal, setShowLikesModal] = useState<boolean>(false);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [likesPostId, setLikesPostId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const limit = 10;
  const navigate = useNavigate();
  const context = useContext(UserDataContext);

  const loadingMoreRef = useRef(false);
  const buttomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/get-all-posts`,
          {
            params: { page: 1, limit },
          }
        );
        setPosts(res.data.posts);
        setPage(1);
        setHasMore(res.data.currentPage < res.data.totalPages);
      } catch (err) {
        console.log("Error fetching posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialPosts();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get(`/allFriends`);
        if (res.status === 200) setFriends(res.data.friends.slice(0, 4));
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    fetchFriends();
  }, []);

  // Realtime: keep "Your circle" fresh when friend relations change
  // (someone accepts my request, unfriends me, etc.)
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !context?.user?.id) return;

    const refreshFriends = async () => {
      try {
        const res = await api.get(`/allFriends`);
        if (res.status === 200) setFriends(res.data.friends.slice(0, 4));
      } catch (error) {
        console.error("Error refreshing friends:", error);
      }
    };

    socket.on("friend_request_accepted", refreshFriends);
    socket.on("friend_removed", refreshFriends);
    socket.on("friend_request_count", refreshFriends);
    return () => {
      socket.off("friend_request_accepted", refreshFriends);
      socket.off("friend_removed", refreshFriends);
      socket.off("friend_request_count", refreshFriends);
    };
  }, [context?.user?.id]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMoreRef.current || loading || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await api.get(
        `/get-all-posts`,
        {
          params: { page: nextPage, limit },
        }
      );

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = (res.data.posts as PostData[]).filter(
          (p) => !existingIds.has(p.id)
        );
        return [...prev, ...uniqueNew];
      });
      setPage(nextPage);
      setHasMore(res.data.currentPage < res.data.totalPages);
    } catch (err) {
      console.log("Error loading more posts", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    const buttom = buttomRef.current;
    if (!buttom) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(buttom);
    return () => observer.disconnect();
  }, [loadMorePosts]);

  const handleLikeToggle = async (postId: number) => {
    try {
      const res = await api.post(
        `/toggle-like/${postId}`,
        {}
      );
      const liked = Boolean(res.data.liked);
      const me = context?.user;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const currentCount = post.likeCount;
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

  const currentUser = context?.user;
  const otherFriends = friends.map((record) =>
    record.sender_id === currentUser?.id ? record.req_receiver : record.req_sender
  );

  return (
    <div className="min-h-screen bg-ivory-100 text-ink-800">
      <Navbar />

      <div className="mx-auto max-w-[1280px] px-4 pt-8 pb-24 sm:px-6">
        <div className="flex items-start gap-8">
          {/* ── Left sidebar ─────────────────────── */}
          <aside className="sticky top-20 hidden w-[250px] shrink-0 lg:block">
            {/* Profile summary */}
            <div className="card-luxe overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-sage-200 via-ivory-200 to-gold-100" />
              <div className="-mt-8 px-5 pb-5">
                <img
                  src={currentUser?.profile_url || skeletonProfile}
                  alt={currentUser?.user_name || "You"}
                  className="h-16 w-16 rounded-2xl border-[3px] border-white object-cover shadow-[0_4px_14px_rgba(31,29,26,0.16)]"
                />
                <p className="mt-2.5 truncate text-[15px] font-medium text-ink-900">
                  {currentUser?.user_name || "You"}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-400">
                  {currentUser?.email}
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-ivory-100 py-2 text-[12.5px] font-bold text-sage-700 transition-colors duration-150 hover:bg-sage-100"
                >
                  <HiOutlineUser size={14} />
                  View profile
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card-luxe mt-4 p-4">
              <p className="px-2 pb-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-ink-300">
                Quick actions
              </p>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setShowPostModal(true)}
                  className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-sage-100 hover:text-sage-700"
                >
                  <HiOutlinePencilAlt size={17} />
                  Write a post
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-sage-100 hover:text-sage-700"
                >
                  <HiOutlinePhotograph size={17} />
                  Update photo
                </button>
              </div>
            </div>
          </aside>

          {/* ── Feed ─────────────────────────────── */}
          <main className="min-w-0 flex-1">
            {/* Composer card */}
            <div className="card-luxe mb-6 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.profile_url || skeletonProfile}
                  alt={currentUser?.user_name || "You"}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-ivory-400"
                />
                <button
                  onClick={() => setShowPostModal(true)}
                  className="flex-1 rounded-full border border-ivory-300 bg-ivory-100 px-4 py-2.5 text-left text-[13.5px] text-ink-300 transition-all duration-150 hover:border-sage-400 hover:bg-ivory-50"
                >
                  What's on your mind, {currentUser?.user_name?.split(" ")[0] || "friend"}?
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-ivory-300 pt-3">
                <button
                  onClick={() => setShowPostModal(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-ivory-100"
                >
                  <HiOutlinePhotograph size={16} className="text-gold-600" />
                  Photo
                </button>
                <button
                  onClick={() => navigate("/messages")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-ivory-100"
                >
                  <BsChatDots size={15} className="text-sage-600" />
                  Chat
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-luxe overflow-hidden">
                    <div className="flex items-center gap-3 p-6">
                      <div className="h-10 w-10 rounded-full shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-28 rounded-full shimmer" />
                        <div className="h-2 w-16 rounded-full shimmer" />
                      </div>
                    </div>
                    <div className="space-y-2 px-6 pb-6">
                      <div className="h-2.5 w-full rounded-full shimmer" />
                      <div className="h-2.5 w-2/3 rounded-full shimmer" />
                    </div>
                    <div className="h-[220px] w-full shimmer" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="card-luxe px-10 py-16 text-center">
                <p style={serif} className="text-lg italic text-ink-500">
                  Nothing here yet
                </p>
                <p className="mt-2 text-sm text-ink-400">
                  Be the first to share something with the community.
                </p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="btn-primary mt-6 px-5 py-2.5"
                >
                  <HiOutlinePencilAlt size={15} />
                  Write the first post
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="card-luxe overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-6 pb-4 pt-6">
                      <img
                        src={post.users?.profile_url || skeletonProfile}
                        alt={post.users?.user_name}
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-1 ring-ivory-400"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => navigate(`/users/${post.users?.id}`)}
                          style={serif}
                          className="cursor-pointer truncate text-[15px] font-medium text-ink-900 transition-colors hover:text-sage-700"
                        >
                          {post.users?.user_name}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {post.visiblity === "all" ? (
                            <BsGlobe className="text-ink-300" size={12} />
                          ) : (
                            <BsLock className="text-ink-300" size={12} />
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

                    {post.content && (
                      <div className="px-6 pb-4">
                        <p className="text-[14.5px] leading-relaxed text-ink-700 whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    )}

                    <PostMedia media={post.media} />

                    <LikersSummary
                      likers={post.likers}
                      likeCount={post.likeCount}
                      isOwnPost={post.user_id === currentUser?.id}
                      onOpen={() => {
                        setLikesPostId(post.id);
                        setShowLikesModal(true);
                      }}
                    />

                    {/* Actions */}
                    <div className="flex items-center border-t border-ivory-300 px-4 py-1">
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold transition-colors duration-150
                          ${
                            post.likedByCurrentUser
                              ? "bg-sage-100 text-sage-700"
                              : "text-ink-500 hover:bg-ivory-100 hover:text-ink-900"
                          }`}
                      >
                        {post.likedByCurrentUser ? (
                          <FaThumbsUp size={13} />
                        ) : (
                          <FaRegThumbsUp size={13} />
                        )}
                        {post.likeCount > 0 ? (
                          <span>{post.likeCount} Like</span>
                        ) : (
                          <span>Like</span>
                        )}
                      </button>

                      <div className="h-5 w-px bg-ivory-300" />

                      <button
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setShowCommentModal(true);
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-ivory-100 hover:text-ink-900"
                      >
                        <FaRegComment size={13} />
                        <span>
                          {post.commentCount > 0 ? post.commentCount : ""} Comment
                        </span>
                      </button>
                    </div>
                  </article>
                ))}

                {showLikesModal && likesPostId !== null && (
                  <LikesModal
                    postId={likesPostId}
                    likeCount={posts.find((p) => p.id === likesPostId)?.likeCount ?? 0}
                    onClose={() => { setShowLikesModal(false); setLikesPostId(null); }}
                  />
                )}
                {showCommentModal && selectedPostId !== null && (
                  <CommentModal
                    postId={selectedPostId}
                    onCommentAdded={() => {
                      setPosts((prev) =>
                        prev.map((p) =>
                          p.id === selectedPostId
                            ? { ...p, commentCount: p.commentCount + 1 }
                            : p
                        )
                      );
                    }}
                    onCommentDelete={() => {
                      setPosts((prev) =>
                        prev.map((p) =>
                          p.id === selectedPostId
                            ? { ...p, commentCount: p.commentCount - 1 }
                            : p
                        )
                      );
                    }}
                    setAlert={setAlert}
                    onClose={() => setShowCommentModal(false)}
                  />
                )}
              </div>
            )}

            {!loading && posts.length > 0 && (
              <div ref={buttomRef} className="flex items-center justify-center py-10">
                {loadingMore && (
                  <span className="flex items-center gap-2 text-xs text-ink-400">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ivory-400 border-t-sage-700" />
                    Loading more posts
                  </span>
                )}
                {!hasMore && (
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-300">
                    You're all caught up
                  </p>
                )}
              </div>
            )}
          </main>

          {/* ── Right sidebar ────────────────────── */}
          <aside className="sticky top-20 hidden w-[280px] shrink-0 xl:block">
            <div className="card-luxe max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
              <div className="flex items-center justify-between px-2 pb-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-ink-300">
                  Your circle
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-[12px] font-bold text-sage-700 transition-colors hover:text-sage-600 hover:underline"
                >
                  View all
                </button>
              </div>

              {otherFriends.length === 0 ? (
                <p className="px-2 py-4 text-[13px] leading-relaxed text-ink-400">
                  As you add friends, they'll appear here for quick chats.
                </p>
              ) : (
                <div className="flex flex-col">
                  {otherFriends.map((f) => (
                    <div
                      key={f.id}
                      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-ivory-100"
                    >
                      <img
                        src={f.profile_url || skeletonProfile}
                        alt={f.user_name}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-ivory-400"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-ink-800">
                          {f.user_name}
                        </p>
                        <p className="truncate text-[11.5px] text-ink-400">{f.email}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/messages/${f.id}`)}
                        aria-label={`Message ${f.user_name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 opacity-0 transition-all duration-150 hover:bg-sage-100 hover:text-sage-700 group-hover:opacity-100"
                      >
                        <BsChatDots size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {showPostModal && (
        <PostModal setPosts={setPosts} setAlert={setAlert} onClose={() => setShowPostModal(false)} />
      )}
    </div>
  );
};

export default HomePage;