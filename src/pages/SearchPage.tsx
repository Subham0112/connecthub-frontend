import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BsSearch, BsGlobe, BsLock } from "react-icons/bs";
import { FaRegComment, FaRegThumbsUp, FaThumbsUp } from "react-icons/fa";
import { HiOutlineChevronRight } from "react-icons/hi";
import Navbar from "../components/Navbar";
import CommentModal from "../components/CommentModal";
import LikeModal from "../components/LikeModal";
import PostMedia from "../components/PostMedia";
import LikersSummary from "../components/LikersSummary";
import type { AlertData } from "../components/Alert";
import { UserDataContext } from "../context/userContext";
import { formatPostTime } from "../lib/postTime";
import api from "../lib/axiosInstance";
import skeletonProfile from "../assets/img/skeleton_profile.jpg";
import type {
  SearchPost,
  SearchResponse,
  SearchUser,
} from "../lib/searchTypes";

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

type SearchTab = "all" | "users" | "posts";

const tabs: { key: SearchTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "users", label: "People" },
  { key: "posts", label: "Posts" },
];

const getInitials = (name?: string | null) =>
  name ? name.slice(0, 2).toUpperCase() : "?";

const SearchPage = ({
  setAlert,
}: {
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
}) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const q = (params.get("q") ?? "").trim();
  const rawType = params.get("type") ?? "all";
  const type: SearchTab = (["all", "users", "posts"].includes(rawType)
    ? rawType
    : "all") as SearchTab;

  const [mobileQuery, setMobileQuery] = useState(q);

  useEffect(() => {
    setMobileQuery(q);
  }, [q]);

  const goTo = (nextQuery: string, nextType: SearchTab) => {
    const value = nextQuery.trim();
    if (!value) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(value)}&type=${nextType}`);
  };

  return (
    <div className="min-h-screen bg-ivory-100 text-ink-800">
      <Navbar />

      <div className="mx-auto max-w-[900px] px-3 pb-24 pt-4 sm:px-6 sm:pt-8">
        <div className="card-luxe overflow-hidden">
          {/* Header */}
          <div className="px-4 pb-4 pt-4 sm:px-7 sm:py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1
                  style={serif}
                  className="text-[19px] font-medium leading-tight text-ink-900 sm:text-[24px]"
                >
                  Search
                </h1>
                <p className="mt-0.5 hidden text-[12.5px] text-ink-400 sm:block">
                  Find people and posts across ConnectHub
                </p>
              </div>
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 sm:flex">
                <BsSearch size={17} />
              </div>
            </div>

            {/* Mobile search — desktop uses the navbar search */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                goTo(mobileQuery, type);
              }}
              className="mt-3 md:hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-ivory-300 bg-ivory-100 px-3 py-2 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
                <BsSearch className="shrink-0 text-ink-300" size={14} />
                <input
                  value={mobileQuery}
                  onChange={(event) => setMobileQuery(event.target.value)}
                  type="search"
                  autoFocus={!q}
                  placeholder="Search people or posts…"
                  aria-label="Search people or posts"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-300"
                />
                <button
                  type="submit"
                  className="btn-primary shrink-0 px-3 py-1.5 text-[11.5px]"
                >
                  Search
                </button>
              </div>
            </form>

            {q && (
              <p className="mt-2.5 truncate text-[12px] text-ink-400 sm:mt-3 sm:text-[12.5px]">
                Results for{" "}
                <span className="font-semibold text-ink-700">“{q}”</span>
              </p>
            )}

            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 sm:mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => goTo(mobileQuery, tab.key)}
                  disabled={!mobileQuery.trim()}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-[12px] ${
                    type === tab.key
                      ? "bg-ink-900 text-white"
                      : "bg-ivory-100 text-ink-500 hover:bg-ivory-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {q ? (
            <SearchResults
              key={`${q}:${type}`}
              q={q}
              type={type}
              setAlert={setAlert}
            />
          ) : (
            <div className="border-t border-ivory-300 px-5 py-14 text-center sm:px-7 sm:py-20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ivory-100 text-ink-300 sm:mb-5 sm:h-16 sm:w-16">
                <BsSearch size={23} />
              </div>
              <p style={serif} className="text-base italic text-ink-500 sm:text-lg">
                Search ConnectHub
              </p>
              <p className="mt-2 text-[12.5px] text-ink-400">
                Try a person's name, their email, or a word from a post.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchResults = ({
  q,
  type,
  setAlert,
}: {
  q: string;
  type: SearchTab;
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
}) => {
  const navigate = useNavigate();
  const context = useContext(UserDataContext);
  const me = context?.user;

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [postTotal, setPostTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [likesPostId, setLikesPostId] = useState<number | null>(null);

  const limit = type === "all" ? 6 : 20;

  useEffect(() => {
    let cancelled = false;

    const fetchResults = async () => {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await api.get<SearchResponse>("/search", {
          params: { q, type, page, limit },
        });
        if (cancelled) return;

        const data = res.data;
        setUsers((prev) =>
          page === 1 ? data.users.items : [...prev, ...data.users.items]
        );
        setPosts((prev) =>
          page === 1 ? data.posts.items : [...prev, ...data.posts.items]
        );
        setUserTotal(data.users.total);
        setPostTotal(data.posts.total);
      } catch (err) {
        if (cancelled) return;
        console.log("Error searching", err);
        setError("Something went wrong while searching. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [q, type, page, limit]);

  const handleLikeToggle = async (postId: number) => {
    try {
      const res = await api.post(`/toggle-like/${postId}`, {});
      const liked = Boolean(res.data.liked);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
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
            likeCount: liked
              ? post.likeCount + 1
              : Math.max(0, post.likeCount - 1),
          };
        })
      );
    } catch (err) {
      console.log("Error toggling like", err);
    }
  };

  const seeAll = (nextType: SearchTab) => {
    navigate(`/search?q=${encodeURIComponent(q)}&type=${nextType}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 border-t border-ivory-300 px-5 py-7 sm:px-7">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 rounded-full shimmer" />
            <div className="flex-1 space-y-2.5">
              <div className="h-2.5 w-1/3 rounded-full shimmer" />
              <div className="h-2.5 w-2/3 rounded-full shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-ivory-300 px-7 py-16 text-center">
        <p style={serif} className="text-base italic text-clay-600">
          {error}
        </p>
      </div>
    );
  }

  const nothingFound = users.length === 0 && posts.length === 0;

  if (nothingFound) {
    return (
      <div className="border-t border-ivory-300 px-7 py-16 text-center">
        <p style={serif} className="text-lg italic text-ink-500">
          No results for “{q}”
        </p>
        <p className="mt-2 text-[12.5px] text-ink-400">
          Try a different name, spelling or keyword.
        </p>
      </div>
    );
  }

  const showPeople = (type === "all" || type === "users") && users.length > 0;
  const showPosts = (type === "all" || type === "posts") && posts.length > 0;
  const canLoadMore =
    type !== "all" &&
    (type === "users" ? users.length < userTotal : posts.length < postTotal);

  return (
    <div className="border-t border-ivory-300">
      {showPeople && (
        <section className="px-5 py-6 sm:px-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
              People
              <span className="ml-2 text-ink-400">{userTotal}</span>
            </h2>
            {type === "all" && userTotal > users.length && (
              <button
                onClick={() => seeAll("users")}
                className="text-[12px] font-bold text-sage-700 transition-colors hover:text-sage-600 hover:underline"
              >
                See all people
              </button>
            )}
          </div>

          <div className="flex flex-col divide-y divide-ivory-300 overflow-hidden rounded-2xl border border-ivory-300">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => navigate(`/users/${user.id}`)}
                className="group flex items-center gap-4 bg-white px-4 py-3.5 text-left transition-colors hover:bg-ivory-50"
              >
                {user.profile_url ? (
                  <img
                    src={user.profile_url}
                    alt={user.user_name || "User"}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-ivory-400"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ivory-200 text-[13px] font-semibold text-ink-600">
                    {getInitials(user.user_name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p style={serif} className="truncate text-[15px] font-medium text-ink-900">
                    {user.user_name || "Unnamed user"}
                  </p>
                  <p className="truncate text-[12px] text-ink-400">{user.email}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-sage-700 opacity-0 transition-opacity group-hover:opacity-100">
                  View profile
                  <HiOutlineChevronRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {showPosts && (
        <section className={`px-5 py-6 sm:px-7 ${showPeople ? "border-t border-ivory-300" : ""}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-300">
              Posts
              <span className="ml-2 text-ink-400">{postTotal}</span>
            </h2>
            {type === "all" && postTotal > posts.length && (
              <button
                onClick={() => seeAll("posts")}
                className="text-[12px] font-bold text-sage-700 transition-colors hover:text-sage-600 hover:underline"
              >
                See all posts
              </button>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-ivory-400 bg-white shadow-hairline"
              >
                <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                  <img
                    src={post.users?.profile_url || skeletonProfile}
                    alt={post.users?.user_name || "User"}
                    onClick={() =>
                      post.users?.id && navigate(`/users/${post.users.id}`)
                    }
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-full object-cover ring-1 ring-ivory-400"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      onClick={() =>
                        post.users?.id && navigate(`/users/${post.users.id}`)
                      }
                      style={serif}
                      className="cursor-pointer truncate text-[15px] font-medium text-ink-900 transition-colors hover:text-sage-700"
                    >
                      {post.users?.user_name || "Unknown user"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {post.visiblity === "all" ? (
                        <BsGlobe className="text-ink-300" size={9} />
                      ) : (
                        <BsLock className="text-ink-300" size={9} />
                      )}
                      <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        {post.visiblity === "all" ? "Public" : "Only me"}
                      </span>
                      {post.created_at && (
                        <>
                          <span className="text-ink-300">·</span>
                          <span className="text-[10px] font-medium text-ink-300">
                            {formatPostTime(post.created_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {post.content && (
                  <div className="px-5 pb-4">
                    <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-700">
                      {post.content}
                    </p>
                  </div>
                )}

                <PostMedia media={post.media} />

                <LikersSummary
                  likers={post.likers}
                  likeCount={post.likeCount}
                  isOwnPost={post.user_id === me?.id}
                  onOpen={() => {
                    setLikesPostId(post.id);
                    setShowLikesModal(true);
                  }}
                />

                <div className="flex items-center border-t border-ivory-300 px-4 py-1">
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
          </div>
        </section>
      )}

      {canLoadMore && (
        <div className="flex justify-center border-t border-ivory-300 px-5 py-6">
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={loadingMore}
            className="btn-outline px-5 py-2.5"
          >
            {loadingMore ? "Loading…" : "Load more results"}
          </button>
        </div>
      )}

      {showCommentModal && selectedPostId !== null && (
        <CommentModal
          postId={selectedPostId}
          setAlert={setAlert}
          onCommentAdded={() => {
            setPosts((prev) =>
              prev.map((post) =>
                post.id === selectedPostId
                  ? { ...post, commentCount: post.commentCount + 1 }
                  : post
              )
            );
          }}
          onCommentDelete={() => {
            setPosts((prev) =>
              prev.map((post) =>
                post.id === selectedPostId
                  ? {
                      ...post,
                      commentCount: Math.max(0, post.commentCount - 1),
                    }
                  : post
              )
            );
          }}
          onClose={() => setShowCommentModal(false)}
        />
      )}

      {showLikesModal && likesPostId !== null && (
        <LikeModal
          postId={likesPostId}
          likeCount={
            posts.find((post) => post.id === likesPostId)?.likeCount ?? 0
          }
          onClose={() => {
            setShowLikesModal(false);
            setLikesPostId(null);
          }}
        />
      )}
    </div>
  );
};

export default SearchPage;
