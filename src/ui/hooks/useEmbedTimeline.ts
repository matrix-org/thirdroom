import {
  TimelineView as HydrogenTimelineView,
  TimelineViewModel,
  SimpleTile,
  TileViewConstructor,
} from "@thirdroom/hydrogen-view-sdk";
import React, { useEffect } from "react";

export function useEmbedTimeline(
  host: React.RefObject<HTMLDivElement>,
  timelineViewModel: TimelineViewModel,
  viewClassForTile: (vm: SimpleTile) => TileViewConstructor
) {
  useEffect(() => {
    const timelineView = new HydrogenTimelineView(timelineViewModel, viewClassForTile);

    const tvDOM = timelineView.mount() as Element;
    host.current!.append(tvDOM);

    return () => {
      timelineView.unmount();
    };
  }, [host, timelineViewModel, viewClassForTile]);
}
