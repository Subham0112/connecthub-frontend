import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserDataContext } from "../context/userContext";
import {
  FaEllipsisH,
  FaRegEdit,
  FaRegTrashAlt,
  FaRegThumbsUp,
  FaThumbsUp,
  FaRegComment,
} from "react-icons/fa";
import axios from "axios";
import api from "../lib/axiosInstance";
import CommentModal from "../components/CommentModal";
import LikeModal from "../components/LikeModal";
import type { AlertData } from "../components/Alert";
import EditModal from "../components/EditModal";
import PostModal from "../components/PostModal";
import PostMedia from "../components/PostMedia";
import LikersSummary, { type PostLiker } from "../components/LikersSummary";
import { formatPostTime } from "../lib/postTime";
import ProfileUploadModal from "../components/ProfileModal";
import Navbar from "../components/Navbar";
import {
  BsGlobe,
  BsLock,
  BsEnvelopeFill,
} from "react-icons/bs";
import {
  HiOutlinePencilAlt,
  HiOutlinePhotograph,
  HiOutlineLockClosed,
} from "react-icons/hi";
import skeletonProfile from "../assets/img/skeleton_profile.jpg";
import { RiLogoutBoxLine } from "react-icons/ri";
import { MdOutlineDeleteOutline } from "react-icons/md";
import FriendList from "../components/FriendList";
import ConfirmModal from "../components/ConfirmModal";

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

interface FriendUser {
  id: number;
  user_name: string;
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

const SideCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="card-luxe p-5 mb-5">
    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
      {title}
    </h3>
    {children}
  </div>
);

const StatStrip = ({
  items,
}: {
  items: { label: string; value: number }[];
}) => (
  <div className="flex items-center gap-6 sm:gap-10">
    {items.map((s, i) => (
      <div key={s.label} className="flex items-baseline gap-2">
        <span
          style={serif}
          className="text-[20px] font-medium leading-none text-ink-900"
        >
          {s.value.toLocaleString()}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
          {s.label}
        </span>
        {i < items.length - 1 && (
          <span className="ml-4 hidden h-4 w-px bg-ivory-300 sm:block" />
        )}
      </div>
    ))}
  </div>
);

const UserDashboard = ({
  setAlert,
}: {
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showFriendList, setShowFriendList] = useState<boolean>(false);
  const [showPosts, setShowPosts] = useState<boolean>(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesPostId, setLikesPostId] = useState<number | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const context = useContext(UserDataContext);

  useEffect(() => {
    if (openMenuId === null) return;
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuId]);

  useEffect(() => {
    if (!context) return;
    const { user } = context;
    const fetchUserPosts = async () => {
      try {
        const res = await api.get(`/get-post/${user.id}`);
        setPosts(res.data.posts);
      } catch (err) {
        console.log("Error fetching posts", err);
      }
    };
    const fetchFriends = async () => {
      try {
        const res = await api.get(`/allFriends`);
        if (res.status === 200) setFriends(res.data.friends);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    if (user.id) {
      fetchUserPosts();
      fetchFriends();
    }
  }, [context]);

  if (!context) return null;
  const { user, setUser } = context;

  const handleLogoutFromAll = async () => {
    try {
      const res = await api.patch(`/logout-from-all`, {});
      console.log(res.data.message);
      setUser({
        id: 0,
        email: "",
        role: null,
        user_name: "",
        profile_url: null,
      });
      navigate("/login");
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await api.delete(`/deleteUser/${id}`);
      setUser({
        id: 0,
        email: "",
        role: null,
        user_name: "",
        profile_url: null,
      });
      navigate("/login");
    } catch (err) {
      console.log("Error deleting users", err);
    }
  };

  const handleLikeToggle = async (postId: number) => {
    try {
      const res = await api.post(`/toggle-like/${postId}`, {});
      const liked = Boolean(res.data.liked);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const currentCount = post.likeCount ?? 0;
          const existing = post.likers ?? [];
          let likers = existing;

          if (liked && !existing.some((liker) => liker.id === user.id)) {
            likers = [
              {
                id: user.id,
                user_name: user.user_name,
                profile_url: user.profile_url,
              },
              ...existing,
            ].slice(0, 3);
          } else if (!liked) {
            likers = existing.filter((liker) => liker.id !== user.id);
          }

          return {
            ...post,
            likers,
            likedByCurrentUser: liked,
            likeCount: liked ? currentCount + 1 : currentCount - 1,
          };
        }),
      );
    } catch (err) {
      console.log("Error toggling like", err);
    }
  };

  const totalLikes = posts.reduce(
    (sum, post) => sum + (post.likeCount ?? 0),
    0,
  );

  const handlePostDelete = async (id: number) => {
    try {
      const res = await api.delete(`/delete-post/${id}`);
      console.log(res.data.message);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      setAlert({
        type: "success",
        title: "Post Deleted",
        message: res.data.message,
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message)
          setAlert({
            type: "error",
            title: "Error Deleting",
            message: data.message,
          });
      } else {
        setAlert({
          type: "error",
          title: "Error",
          message: "Error deleting post",
        });
      }
    }
  };

  const handleProfileUpdated = (newUrl: string) => {
    setUser((prev) => ({ ...prev, profile_url: newUrl }));
  };

  const profileUrl = user.profile_url;

  const otherFriends = friends.map((record) =>
    record.sender_id === user.id ? record.req_receiver : record.req_sender,
  );

  return (
    <div className="min-h-screen bg-ivory-100 text-ink-800">
      <Navbar />

      <div className="mx-auto max-w-[1080px] px-3 pb-24 pt-6 sm:px-6 sm:pt-8">
        {/* ════════ Profile header ════════ */}
        <div className="card-luxe mb-6 rounded-3xl sm:mb-8">
          {/* Cover */}
          <div className="relative h-40 overflow-hidden rounded-t-3xl bg-gradient-to-br from-sage-200 via-sage-100 to-gold-100 sm:h-44">
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

          {/* Avatar row — overlaps the cover, nothing else */}
          <div className="px-5 sm:px-8">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:-mt-14">
              <div
                onClick={() => setShowProfileModal(true)}
                className="group relative shrink-0 cursor-pointer"
              >
                <img
                  src={profileUrl || skeletonProfile}
                  alt={user.user_name || "User"}
                  className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-[0_8px_24px_rgba(31,29,26,0.18)]"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl transition-colors duration-150 group-hover:bg-ink-900/35">
                  <HiOutlinePhotograph
                    size={22}
                    className="text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  />
                </span>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="btn-outline px-4 py-2.5"
                >
                  <HiOutlinePhotograph size={13} />
                  <span className="hidden sm:inline">
                    {profileUrl ? "Update photo" : "Add photo"}
                  </span>
                  <span className="sm:hidden">Photo</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary px-4 py-2.5"
                >
                  <HiOutlinePencilAlt size={14} />
                  New Post
                </button>
              </div>
            </div>

            {/* Name block — plain normal flow, can never be clipped */}
            <div className="pb-6 pt-4">
              <h1
                style={serif}
                className="text-[26px] font-medium leading-snug tracking-tight text-ink-900 sm:text-[30px]"
              >
                {user?.user_name || "User"}
              </h1>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-400">
                <BsEnvelopeFill size={13} className="shrink-0 text-sage-600" />
                <span className="break-words">{user?.email || ""}</span>
              </p>
            </div>

            {/* Stats strip + tabs */}
            <div className="border-t border-ivory-300 px-5 py-5 sm:px-0 sm:pl-0">
              <StatStrip
                items={[
                  { label: "Posts", value: posts.length },
                  { label: "Likes", value: totalLikes },
                  { label: "Friends", value: otherFriends.length },
                ]}
              />
            </div>

            <div className="flex items-center gap-1 border-t border-ivory-300 px-5 sm:px-7">
              <button
                onClick={() => {
                  setShowPosts(true);
                  setShowFriendList(false);
                }}
                className={`relative px-4 py-3.5 text-[13.5px] font-bold transition-colors duration-150 ${
                  showPosts
                    ? "text-sage-700"
                    : "text-ink-300 hover:text-ink-600"
                }`}
              >
                Posts
                <span className="ml-1.5 text-[11px] font-semibold text-ink-300">
                  {posts.length}
                </span>
                {showPosts && (
                  <span className="absolute inset-x-3 bottom-0 h-[2.5px] rounded-full bg-sage-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setShowFriendList(true);
                  setShowPosts(false);
                }}
                className={`relative px-4 py-3.5 text-[13.5px] font-bold transition-colors duration-150 ${
                  showFriendList
                    ? "text-sage-700"
                    : "text-ink-300 hover:text-ink-600"
                }`}
              >
                Friends
                <span className="ml-1.5 text-[11px] font-semibold text-ink-300">
                  {otherFriends.length}
                </span>
                {showFriendList && (
                  <span className="absolute inset-x-3 bottom-0 h-[2.5px] rounded-full bg-sage-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ════════ Body: two columns ════════ */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Left column — scrolls naturally with the page */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            {/* At a glance */}
           

            {/* Shortcuts */}
            <SideCard title="Shortcuts">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-sage-100 hover:text-sage-700"
                >
                  <HiOutlinePencilAlt size={17} />
                  Write a post
                </button>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-sage-100 hover:text-sage-700"
                >
                  <HiOutlinePhotograph size={17} />
                  Update photo
                </button>
                <button
                  onClick={() => navigate("/change-password")}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-sage-100 hover:text-sage-700"
                >
                  <HiOutlineLockClosed size={17} />
                  Change password
                </button>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-gold-50 hover:text-gold-700"
                >
                  <RiLogoutBoxLine size={17} />
                  Logout all devices
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-600 transition-colors duration-150 hover:bg-clay-100 hover:text-clay-600"
                >
                  <MdOutlineDeleteOutline size={17} />
                  Delete account
                </button>
              </div>
            </SideCard>

            {/* Friends preview */}
            <SideCard title="Friends preview">
              {otherFriends.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-ink-400">
                  Make some friends — they'll show up here.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {otherFriends.slice(0, 9).map((f) => (
                      <div
                        key={f.id}
                        onClick={() => navigate(`/users/${f.id}`)}
                        className="group cursor-pointer overflow-hidden rounded-xl bg-ivory-100 transition-all duration-200 hover:shadow-luxe"
                      >
                        <img
                          src={f.profile_url || skeletonProfile}
                          alt={f.user_name}
                          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                  {otherFriends.length > 0 && (
                    <button
                      onClick={() => {
                        setShowFriendList(true);
                        setShowPosts(false);
                      }}
                      className="mt-3 w-full rounded-xl bg-ivory-100 py-2 text-[12.5px] font-bold text-sage-700 transition-colors duration-150 hover:bg-sage-100"
                    >
                      View all {otherFriends.length} friends
                    </button>
                  )}
                </>
              )}
            </SideCard>
          </aside>

          {/* Right column */}
          <main className="min-w-0 flex-1">
            {showPosts && (
              <div>
                <h3 className="mb-4 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
                  Your Posts
                </h3>

                {posts.length === 0 ? (
                  <div className="card-luxe p-12 text-center">
                    <p
                      style={serif}
                      className="mb-4 text-lg italic text-ink-500"
                    >
                      You haven't posted anything yet
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="btn-primary px-5 py-2.5"
                    >
                      <HiOutlinePencilAlt size={14} />
                      Create your first post
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="card-luxe overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 sm:px-7">
                          <div className="flex min-w-0 items-center gap-3">
                            <img
                              src={profileUrl || skeletonProfile}
                              alt={user.user_name}
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-ivory-400"
                            />
                            <div className="min-w-0">
                              <p
                                style={serif}
                                className="truncate text-[15px] font-medium text-ink-900"
                              >
                                {post.users?.user_name}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5">
                                {post.visiblity === "all" ? (
                                  <BsGlobe
                                    className="shrink-0 text-ink-300"
                                    size={12}
                                  />
                                ) : (
                                  <BsLock
                                    className="shrink-0 text-ink-300"
                                    size={12}
                                  />
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
                          <div className="relative flex shrink-0 items-center">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenuId((current) =>
                                  current === post.id ? null : post.id
                                );
                              }}
                              className="icon-btn"
                              aria-label="Post options"
                              aria-haspopup="menu"
                              aria-expanded={openMenuId === post.id}
                            >
                              <FaEllipsisH size={14} />
                            </button>

                            {openMenuId === post.id && (
                              <div
                                role="menu"
                                onClick={(event) => event.stopPropagation()}
                                className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-ivory-300 bg-white py-1 shadow-[0_12px_32px_rgba(31,29,26,0.16)]"
                              >
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setSelectedPost(post);
                                    setShowEditModal(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-ink-700 transition-colors hover:bg-ivory-100"
                                >
                                  <FaRegEdit size={12} />
                                  Edit post
                                </button>
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handlePostDelete(post.id);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-clay-600 transition-colors hover:bg-clay-100"
                                >
                                  <FaRegTrashAlt size={12} />
                                  Delete post
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {post.content && (
                          <div className="px-6 pb-4 sm:px-7">
                            <p className="text-[14.5px] leading-relaxed text-ink-700 whitespace-pre-wrap">
                              {post.content}
                            </p>
                          </div>
                        )}

                        <PostMedia media={post.media} />

                        <LikersSummary
                          likers={post.likers}
                          likeCount={post.likeCount}
                          isOwnPost={post.user_id === user.id}
                          onOpen={() => {
                            setLikesPostId(post.id);
                            setShowLikesModal(true);
                          }}
                        />

                        <div className="flex gap-2 items-center border-t border-ivory-300 px-4 py-1">
                          <button
                            onClick={() => handleLikeToggle(post.id)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold transition-colors duration-150 ${
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
                              setSelectedPost(post);
                              setShowCommentModal(true);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-ivory-100 hover:text-ink-900"
                          >
                            <FaRegComment size={13} />
                            <span>
                              {post.commentCount > 0 ? post.commentCount : ""}{" "}
                              Comment
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showFriendList && (
              <div>
                <div className="mb-4 flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
                    All Friends
                  </h3>
                  <span className="chip bg-ivory-200 text-ink-500">
                    {otherFriends.length} friends
                  </span>
                </div>
                <FriendList setAlert={setAlert} showFriend={showFriendList} />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Modals ── */}
      {showLogoutModal && (
        <ConfirmModal
          title="Log out everywhere"
          message="This will sign you out from all devices you're currently logged in on. Continue?"
          confirmLabel="Log out all devices"
          loading={false}
          onConfirm={handleLogoutFromAll}
          onClose={() => setShowLogoutModal(false)}
        />
      )}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete account"
          message="This permanently deletes your ConnectHub account, profile, posts, and all your data. This action cannot be undone."
          confirmLabel="Delete account"
          loading={false}
          onConfirm={() => handleDeleteAccount(user.id)}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      {showProfileModal && (
        <ProfileUploadModal
          currentProfileUrl={profileUrl}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={handleProfileUpdated}
          setAlert={setAlert}
        />
      )}
      {showLikesModal && likesPostId !== null && (
        <LikeModal
          postId={likesPostId}
          likeCount={posts.find((p) => p.id === likesPostId)?.likeCount ?? 0}
          onClose={() => {
            setShowLikesModal(false);
            setLikesPostId(null);
          }}
        />
      )}
      {showModal && (
        <PostModal
          setPosts={setPosts}
          setAlert={setAlert}
          onClose={() => setShowModal(false)}
        />
      )}
      {showEditModal && selectedPost && (
        <EditModal
          post={selectedPost}
          setPosts={setPosts}
          setAlert={setAlert}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPost(null);
          }}
        />
      )}
      {showCommentModal && selectedPost && (
        <CommentModal
          postId={selectedPost?.id}
          setAlert={setAlert}
          onCommentAdded={() =>
            setPosts((prev) =>
              prev.map((p) =>
                p.id === selectedPost.id
                  ? { ...p, commentCount: p.commentCount + 1 }
                  : p,
              ),
            )
          }
          onCommentDelete={() =>
            setPosts((prev) =>
              prev.map((p) =>
                p.id === selectedPost.id
                  ? { ...p, commentCount: p.commentCount - 1 }
                  : p,
              ),
            )
          }
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
