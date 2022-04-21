import "./NowPlaying.css";

interface INowPlaying {
  avatar: React.ReactNode;
  content: React.ReactNode;
  options?: React.ReactNode;
  leftControls: React.ReactNode;
  rightControls: React.ReactNode;
}

export function NowPlaying({ avatar, content, options, leftControls, rightControls }: INowPlaying) {
  return (
    <div className="NowPlaying">
      <div className="NowPlaying__main flex items-center">
        <div className="shrink-0">{avatar}</div>
        <div className="grow">{content}</div>
        <div className="shrink-0">{options}</div>
      </div>
      <div className="NowPlaying__controls flex">
        <div className="grow flex">{leftControls}</div>
        <div className="flex">{rightControls}</div>
      </div>
    </div>
  );
}
