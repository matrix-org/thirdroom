import { ReactNode } from "react";
import "./NowPlaying.css";

interface INowPlaying {
  avatar: ReactNode;
  content: ReactNode;
  options?: ReactNode;
  leftControls: ReactNode;
  rightControls?: ReactNode;
}

export function NowPlaying({ avatar, content, options, leftControls, rightControls }: INowPlaying) {
  return (
    <div className="NowPlaying">
      <div className="NowPlaying__main flex items-center">
        <div className="shrink-0">{avatar}</div>
        <div className="grow">{content}</div>
        {options && <div className="shrink-0">{options}</div>}
      </div>
      <div className="NowPlaying__controls flex">
        <div className="grow flex">{leftControls}</div>
        {rightControls && <div className="flex">{rightControls}</div>}
      </div>
    </div>
  );
}
