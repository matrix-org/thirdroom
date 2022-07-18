import { useEffect, useRef, useState } from "react";

import { getStats, StatsObject } from "../../../../engine/stats/stats.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { Text } from "../../../atoms/text/Text";
import "./Stats.css";

interface StatsProps {
  statsEnabled: boolean;
}

export function Stats({ statsEnabled }: StatsProps) {
  const mainThread = useMainThreadContext();
  const [, setFrame] = useState<number>(0);
  const statsRef = useRef<StatsObject>();

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

    if (statsEnabled) {
      onUpdate();
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mainThread, statsEnabled]);

  return statsEnabled ? (
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
