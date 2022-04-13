import { useEffect, useRef } from "react";
import { TimelineView as HydrogenTimelineView, TimelineViewModel, viewClassForTile } from "hydrogen-view-sdk";

import "./TimelineView.css";

interface ITimelineView {
  timelineViewModel: TimelineViewModel;
}

export function TimelineView({ timelineViewModel }: ITimelineView) {
  const timelineViewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timelineView = new HydrogenTimelineView(timelineViewModel, viewClassForTile);

    const tvDOM = timelineView.mount() as Element;
    const tvScroll = tvDOM.querySelector(".Timeline_scroller")!;
    tvScroll.classList.add("Scroll", "Scroll--vertical", "Scroll--invisible");
    timelineViewContainerRef.current!.append(tvDOM);

    return () => {
      timelineView.unmount();
    };
  }, [timelineViewModel]);

  return <div className="TimelineView grow flex hydrogen" ref={timelineViewContainerRef} />;
}
