import { FaThumbsUp } from "react-icons/fa";

export interface PostLiker {
  id: number;
  user_name: string | null;
  profile_url?: string | null;
}

const LikersSummary = ({
  likers = [],
  likeCount,
  onOpen,
}: {
  likers?: PostLiker[];
  likeCount: number;
  isOwnPost?: boolean;
  onOpen?: () => void;
}) => {
  if (likeCount <= 0) return null;

  const firstName = likers[0]?.user_name || "Someone";
  const otherCount = Math.max(0, likeCount - 1);

  const content = (
    <>
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-white">
        <FaThumbsUp size={9} />
      </span>
      <p
        className={`truncate text-left text-[12.5px] text-ink-500 ${
          onOpen ? "group-hover:underline" : ""
        }`}
      >
        <span className="font-semibold text-ink-700">{firstName}</span>
        {otherCount > 0 && (
          <>
            {" "}
            and{" "}
            <span className="font-semibold text-ink-700">{otherCount}</span>{" "}
            {otherCount === 1 ? "other" : "others"}
          </>
        )}
      </p>
    </>
  );

  const className =
    "flex w-full items-center gap-2 px-6 pb-2 pt-3 text-left sm:px-7";

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`group ${className} cursor-pointer transition-colors hover:bg-ivory-100/60`}
        aria-label="View people who liked this post"
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export default LikersSummary;
