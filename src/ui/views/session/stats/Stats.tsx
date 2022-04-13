import { useEffect, useRef, useState } from "react";

import { StatsObject } from "../../../../engine/stats";
import { useEngine } from "../../../hooks/useEngine";
import "./Stats.css";

export function Stats() {
  const { getStats } = useEngine();
  const [showStats, setShowStats] = useState<boolean>(false);
  const [, setFrame] = useState<number>(0);
  const statsRef = useRef<StatsObject>();

  useEffect(() => {
    const global = window as unknown as any;

    if (!global.thirdroom) {
      global.thirdroom = {};
    }

    global.thirdroom.showStats = (value = true) => {
      setShowStats(value);
    };

    return () => {
      global.thirdroom.showStats = () => {};
    };
  }, []);

  useEffect(() => {
    let timeoutId: number;

    const onUpdate = () => {
      const stats = getStats();
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
  }, [getStats, showStats]);

  return showStats ? (
    <div className="Stats">
      {statsRef.current &&
        Object.entries(statsRef.current).map(([name, value]) => {
          return (
            <div key={name}>
              <b>{name}:</b>
              {" " + value}
            </div>
          );
        })}
    </div>
  ) : null;
}
