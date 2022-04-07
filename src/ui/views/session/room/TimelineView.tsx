import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { TimelineViewModel } from "hydrogen-view-sdk";

import { Text } from "../../../atoms/text/Text";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { TextTile } from "./tiles/TextTile";
import "./TimelineView.css";

interface ITimelineView {
  roomId: string;
  vm: typeof TimelineViewModel;
}

export function TimelineView({ roomId, vm }: ITimelineView) {
  window.tvm = vm;
  window.tiles = vm.tiles;
  const { tiles } = vm;
  const [update, forceUpdate] = useState({});
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const tScroll = timelineScrollRef.current;
    if (tScroll !== null) {
      const { clientHeight, scrollHeight } = tScroll;
      tScroll.scrollTop = scrollHeight - clientHeight;
    }
  };

  const tryLoadTop = useCallback(
    (scrollElement: HTMLElement) => {
      const loadMore = scrollElement.scrollTop < 100;
      if (loadMore && vm._topLoadingPromise === null) {
        vm.setVisibleTileRange(tiles.getFirst(), tiles._findTileAtIdx(tiles.length - 1));
        console.log("loading more..");
      }
    },
    [vm, tiles]
  );

  useEffect(() => {
    const onReset = () => forceUpdate({});
    const onAdd = () => forceUpdate({});
    const onUpdate = () => forceUpdate({});
    const onRemove = () => forceUpdate({});
    const onMove = () => forceUpdate({});

    forceUpdate({});
    return tiles.subscribe({
      onReset,
      onAdd,
      onUpdate,
      onRemove,
      onMove,
    });
  }, [roomId, tiles]);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [update]);

  useEffect(() => {
    if (timelineScrollRef.current) {
      tryLoadTop(timelineScrollRef.current);
    }
  }, [update, vm, tryLoadTop]);

  const handleOnScroll = (evt: React.UIEvent<HTMLElement>) => {
    tryLoadTop(evt.currentTarget);
  };

  const renderTimeline = () => {
    const reactTiles = [];
    for (const tile of tiles) {
      const sender = tile.displayName;
      const plainBody = tile._getPlainBody?.();
      if (plainBody) reactTiles.push(<TextTile key={tile.id.eventIndex} sender={sender} body={plainBody} />);
    }
    return reactTiles;
  };

  return (
    <div className="TimelineView grow">
      <Scroll onScroll={handleOnScroll} forwardRef={timelineScrollRef} visibility="invisible">
        <div className="TimelineView__content flex flex-column justify-end items-start">
          {tiles.hasSubscriptions && renderTimeline()}
          {tiles.hasSubscriptions === false && <Text>loading...</Text>}
        </div>
      </Scroll>
    </div>
  );
}
