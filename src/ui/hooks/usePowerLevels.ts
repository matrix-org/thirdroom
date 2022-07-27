import { Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useCallback, useState } from "react";

import { useStateEventKeyCallback } from "./useStateEventKeyCallback";

enum DefaultPowerLevels {
  usersDefault = 0,
  stateDefault = 50,
  eventsDefault = 0,
  invite = 0,
  redact = 50,
  kick = 50,
  ban = 50,
  historical = 0,
}

interface IPowerLevels {
  users_default?: number;
  state_default?: number;
  events_default?: number;
  historical?: number;
  invite?: number;
  redact?: number;
  kick?: number;
  ban?: number;

  events?: Record<string, number>;
  users?: Record<string, number>;
  notifications?: Record<string, number>;
}

export function usePowerLevels(room: Room) {
  const [powerLevels, setPowerLevels] = useState<IPowerLevels>();

  const callback = useCallback((stateEvent: StateEvent | undefined) => {
    if (stateEvent) {
      const { content } = stateEvent;
      setPowerLevels(content);
    } else {
      setPowerLevels(undefined);
    }
  }, []);

  useStateEventKeyCallback(room, "m.room.power_levels", "", callback);

  const getPowerLevel = useCallback(
    (userId: string) => {
      if (!powerLevels) return 0;
      const { users_default: usersDefault, users } = powerLevels;
      if (users && users[userId] !== undefined) {
        return users[userId];
      }
      return usersDefault ?? DefaultPowerLevels.usersDefault;
    },
    [powerLevels]
  );

  const canSendEvent = useCallback(
    (eventType: string, powerLevel: number) => {
      if (!powerLevels) return powerLevel >= 0;
      const { events, events_default: eventsDefault } = powerLevels;
      if (events && events[eventType] !== undefined) {
        return powerLevel >= events[eventType];
      }
      return powerLevel >= (eventsDefault ?? DefaultPowerLevels.eventsDefault);
    },
    [powerLevels]
  );

  const canSendStateEvent = useCallback(
    (eventType: string, powerLevel: number) => {
      if (!powerLevels) return powerLevel >= 0;
      const { events, state_default: stateDefault } = powerLevels;
      if (events && events[eventType] !== undefined) {
        return powerLevel >= events[eventType];
      }
      return powerLevel >= (stateDefault ?? DefaultPowerLevels.stateDefault);
    },
    [powerLevels]
  );

  const canDoAction = useCallback(
    (action: "invite" | "redact" | "kick" | "ban" | "historical", powerLevel: number) => {
      const requiredPL = powerLevels?.[action];
      if (requiredPL !== undefined) {
        return powerLevel >= requiredPL;
      }
      return powerLevel >= DefaultPowerLevels[action];
    },
    [powerLevels]
  );

  return {
    getPowerLevel,
    canSendEvent,
    canSendStateEvent,
    canDoAction,
  };
}
