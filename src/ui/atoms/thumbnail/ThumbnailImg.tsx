import "./ThumbnailImg.css";

interface ThumbnailImgProps {
  src: string;
  alt?: string;
}

export function ThumbnailImg({ src, alt }: ThumbnailImgProps) {
  return <img className="ThumbnailImg" draggable="false" src={src} alt={alt} />;
}
