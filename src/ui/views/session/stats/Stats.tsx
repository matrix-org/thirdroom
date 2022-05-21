import { useEffect, useRef, useState } from "react";

import { getStats, StatsObject } from "../../../../engine/stats/stats.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { Text } from "../../../atoms/text/Text";
import "./Stats.css";
import { registerThirdroomGlobalFn } from "../../../../engine/utils/registerThirdroomGlobal";

export function Stats() {
  const mainThread = useMainThreadContext();
  const [showStats, setShowStats] = useState<boolean>(false);
  const [, setFrame] = useState<number>(0);
  const statsRef = useRef<StatsObject>();

  useEffect(() => {
    return registerThirdroomGlobalFn("showStats", (value: boolean) => {
      setShowStats(value);
    });
  }, []);

  useEffect(() => {
    let timeoutId: number;

    const onUpdate = () => {
      const stats = getStats(mainThread);
      statsRef.current = stats;

      if (stats) {
        setFrame(stats.frame as number);
      }

      timeoutId = window.setTimeout(onUpdate, 100);
    };

    if (showStats) {
      onUpdate();
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mainThread, showStats]);

  return showStats ? (
    <div className="Stats">
      {statsRef.current &&
        Object.entries(statsRef.current).map(([name, value]) => {
          return (
            <Text variant="b1" color="world" key={name}>
              <b>{name}:</b>
              {" " + value}
            </Text>
          );
        })}
    </div>
  ) : null;
}
