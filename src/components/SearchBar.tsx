import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BsSearch } from "react-icons/bs";
import { HiX } from "react-icons/hi";
import api from "../lib/axiosInstance";
import skeletonProfile from "../assets/img/skeleton_profile.jpg";
import type { SearchResponse, SearchUser } from "../lib/searchTypes";

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const urlQuery = (params.get("q") ?? "").trim();

  useEffect(() => {
    if (location.pathname === "/search") {
      setQuery(urlQuery);
    }
  }, [location.pathname, urlQuery]);

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
    if (!trimmed) {
      setUsers([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get<SearchResponse>("/search", {
          params: { q: trimmed, type: "users", limit: 6 },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setUsers(res.data.users.items);
        setActiveIndex(-1);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.log("Error searching", err);
          setUsers([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const goToFullSearch = () => {
    if (!trimmed) return;
    setOpen(false);
    setActiveIndex(-1);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    inputRef.current?.blur();
  };

  const handleSelect = (user: SearchUser) => {
    setOpen(false);
    setActiveIndex(-1);
    navigate(`/users/${user.id}`);
    inputRef.current?.blur();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && users[activeIndex]) {
      handleSelect(users[activeIndex]);
      return;
    }
    goToFullSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, users.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }
  };

  const showDropdown = open && trimmed.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2.5 rounded-xl border border-ivory-400 bg-ivory-100 px-3 py-2 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
          <BsSearch className="shrink-0 text-ink-300" size={14} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => trimmed && setOpen(true)}
            onKeyDown={handleKeyDown}
            type="search"
            placeholder="Search people…"
            aria-label="Search people"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-300"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setUsers([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ivory-300 hover:text-ink-600"
            >
              <HiX size={12} />
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[260px] overflow-hidden rounded-2xl border border-ivory-400 bg-white shadow-lift animate-fade-in">
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full shimmer" />
                    <div className="h-2.5 w-1/2 rounded-full shimmer" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p style={serif} className="text-[15px] italic text-ink-500">
                  No people found for “{trimmed}”
                </p>
                <p className="mt-1.5 text-[12px] text-ink-400">
                  Try a different name.
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="px-4 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-300">
                  People
                </p>
                {users.map((user, index) => {
                  const active = activeIndex === index;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(user)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active ? "bg-ivory-100" : "hover:bg-ivory-100"
                      }`}
                    >
                      <img
                        src={user.profile_url || skeletonProfile}
                        alt={user.user_name || "User"}
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-ivory-400"
                      />
                      <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900">
                        {user.user_name || "Unnamed user"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!loading && trimmed && (
            <button
              type="button"
              onClick={goToFullSearch}
              className="flex w-full items-center justify-between border-t border-ivory-300 bg-ivory-50 px-4 py-3 text-[12.5px] font-bold text-sage-700 transition-colors hover:bg-sage-50"
            >
              <span>See all results for “{trimmed}”</span>
              <BsSearch size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
