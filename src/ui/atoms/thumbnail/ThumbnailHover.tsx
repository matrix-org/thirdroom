import "./ThumbnailHover.css";

interface ThumbnailHoverPops {
  content?: React.ReactNode;
  children: React.ReactNode;
}

export function ThumbnailHover({ content, children }: ThumbnailHoverPops) {
  return (
    <div className="ThumbnailHover">
      {children}
      {content && <div className="ThumbnailHover__content">{content}</div>}
    </div>
  );
}
