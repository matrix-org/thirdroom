import React from "react";
import './TimelineView.css';
import "hydrogen-view-sdk/style.css";
import {
  TimelineViewModel,
  TimelineView as TimelineViewConstructor,
} from 'hydrogen-view-sdk';

interface ITimelineView {
  roomId: string,
  vm: typeof TimelineViewModel
}

export function TimelineView({
  roomId,
  vm,
}: ITimelineView) {
  React.useEffect(() => {
    const tv = new TimelineViewConstructor(vm);
    const tvDOM = tv.mount();

    const tvScroll = tvDOM.querySelector('.Timeline_scroller');
    tvScroll.classList.add('Scroll', 'Scroll--vertical', 'Scroll--auto');

    const tvContainer = document.getElementById('TimelineView');
    tvContainer?.append(tvDOM);

    return () => {
      tv.unmount();
      if (tvContainer?.hasChildNodes()) {
        tvContainer?.removeChild(tvContainer?.childNodes[0]);
      }
    }
  }, [roomId, vm]);

  return (
    <div className="TimelineView grow flex hydrogen" id="TimelineView" />
  );
}