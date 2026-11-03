export interface SearchUser {
  id: number;
  user_name: string | null;
  email: string | null;
  profile_url?: string | null;
}

export interface SearchMedia {
  media_id: number;
  post_id: number;
  user_id: number;
  filename: string;
  file_url: string;
}

export interface SearchLiker {
  id: number;
  user_name: string | null;
  profile_url?: string | null;
}

export interface SearchPost {
  id: number;
  user_id: number;
  content: string | null;
  visiblity: string | null;
  created_at?: string | null;
  media?: SearchMedia[];
  users?: SearchUser | null;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  likers?: SearchLiker[];
}

export interface SearchSection<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
}

export interface SearchResponse {
  query: string;
  users: SearchSection<SearchUser>;
  posts: SearchSection<SearchPost>;
}
