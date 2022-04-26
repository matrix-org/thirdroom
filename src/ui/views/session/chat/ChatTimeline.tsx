import { useRef } from "react";
import { TimelineViewModel } from "@thirdroom/hydrogen-view-sdk";

import "./ChatTimeline.css";
import { useEmbedTimeline } from "../../../hooks/useEmbedTimeline";
import { viewClassForTile } from "./tiles";

interface ChatTimelineProps {
  timelineViewModel: TimelineViewModel;
}

export function ChatTimeline({ timelineViewModel }: ChatTimelineProps) {
  const chatTimelineRef = useRef<HTMLDivElement>(null);
  useEmbedTimeline(chatTimelineRef, timelineViewModel, viewClassForTile);

  return <div className="ChatTimeline flex" ref={chatTimelineRef} />;
}
