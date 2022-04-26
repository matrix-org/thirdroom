import { useEffect, useRef } from "react";
import { TimelineView as HydrogenTimelineView, TimelineViewModel } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChatTimeline.css";
import { viewClassForTile } from "./tiles";

interface IWorldChatTimeline {
  timelineViewModel: TimelineViewModel;
}

export function WorldChatTimeline({ timelineViewModel }: IWorldChatTimeline) {
  const timelineViewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timelineView = new HydrogenTimelineView(timelineViewModel, viewClassForTile);

    const tvDOM = timelineView.mount() as Element;
    timelineViewContainerRef.current!.append(tvDOM);

    return () => {
      timelineView.unmount();
    };
  }, [timelineViewModel]);

  return <div className="WorldChatTimeline grow flex hydrogen" ref={timelineViewContainerRef} />;
}
