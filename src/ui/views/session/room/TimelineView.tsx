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
    const timelineView = new TimelineViewConstructor(vm);
    const timelineViewHtml = timelineView.mount();

    const chatContainer = document.getElementById('TimelineView');
    chatContainer?.append(timelineViewHtml);

    return () => {
      timelineView.unmount();
      if (chatContainer?.hasChildNodes()) {
        chatContainer?.removeChild(chatContainer?.childNodes[0]);
      }
    }
  }, [roomId, vm]);

  return (
    <div className="TimelineView grow flex hydrogen" id="TimelineView" />
  );
}