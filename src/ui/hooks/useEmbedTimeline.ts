import { RefObject, useEffect } from "react";
import {
  TimelineView as HydrogenTimelineView,
  TimelineViewModel,
  SimpleTile,
  TileViewConstructor,
} from "@thirdroom/hydrogen-view-sdk";

export function useEmbedTimeline(
  host: RefObject<HTMLDivElement>,
  timelineViewModel: TimelineViewModel,
  viewClassForTile: (vm: SimpleTile) => TileViewConstructor
) {
  useEffect(() => {
    const timelineView = new HydrogenTimelineView(timelineViewModel, viewClassForTile);
    if (host.current) {
      const tvDOM = timelineView.mount() as Element;
      const tvScroll = tvDOM.querySelector(".Timeline_scroller")!;
      tvScroll.classList.add("legacy-scroll", "legacy-scroll--vertical", "legacy-scroll--invisible");
      while (host.current.lastChild) {
        host.current.removeChild(host.current.lastChild);
      }
      host.current.append(tvDOM);
    }

    return () => {
      timelineView.unmount();
    };
  }, [host, timelineViewModel, viewClassForTile]);
}
