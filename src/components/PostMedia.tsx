export interface PostMediaItem {
  media_id: number;
  file_url: string;
  filename?: string | null;
}

const isVideo = (item: PostMediaItem) =>
  /\.(mp4|webm|mov|m4v|ogg)$/i.test(item.filename ?? item.file_url);

const MediaAsset = ({
  item,
  className,
  controls = false,
}: {
  item: PostMediaItem;
  className: string;
  controls?: boolean;
}) => {
  if (isVideo(item)) {
    return (
      <video
        src={item.file_url}
        controls={controls}
        muted
        playsInline
        preload="metadata"
        className={className}
      />
    );
  }

  return (
    <img
      src={item.file_url}
      alt={item.filename ?? "Post media"}
      loading="lazy"
      className={className}
    />
  );
};

const PostMedia = ({ media }: { media?: PostMediaItem[] }) => {
  const items = (media ?? []).filter(Boolean);
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="mt-1 border-t border-ivory-300 bg-ivory-200">
        <MediaAsset
          item={items[0]}
          controls
          className="max-h-[440px] w-full object-cover"
        />
      </div>
    );
  }

  const visible = items.slice(0, 4);
  const extraCount = items.length - visible.length;
  const isThree = items.length === 3;

  return (
    <div
      className="mt-1  grid grid-cols-2 gap-1 border-t border-ivory-300 bg-ivory-200"
      style={{ gridAutoRows: "1fr" }}
    >
      {visible.map((item, index) => {
        const isLargeTile = isThree && index === 0;
        return (
          <div
            key={item.media_id}
            className={`relative overflow-hidden ${
              isLargeTile ? "row-span-2" : "aspect-square"
            }`}
          >
            <MediaAsset
              item={item}
              className={`h-full w-full object-cover ${
                isLargeTile ? "min-h-[200px]" : ""
              }`}
            />
            {index === 3 && extraCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-900/55">
                <span className="text-2xl font-semibold text-white">
                  +{extraCount}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PostMedia;
