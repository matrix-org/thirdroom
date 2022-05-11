import { useRef } from "react";
import { TimelineViewModel } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChatTimeline.css";
import { useEmbedTimeline } from "../../../hooks/useEmbedTimeline";
import { viewClassForTile } from "./tiles";

interface IWorldChatTimeline {
  timelineViewModel: TimelineViewModel;
}

export function WorldChatTimeline({ timelineViewModel }: IWorldChatTimeline) {
  const timelineViewContainerRef = useRef<HTMLDivElement>(null);
  useEmbedTimeline(timelineViewContainerRef, timelineViewModel, viewClassForTile);

  return <div className="WorldChatTimeline grow flex" ref={timelineViewContainerRef} />;
}
