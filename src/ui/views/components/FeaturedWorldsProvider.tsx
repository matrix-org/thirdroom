import { Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";

import { useStateEvents } from "../../hooks/useStateEvents";
import { RepositoryEvents } from "../session/discover/DiscoverView";

export function useFeaturedWorlds(repoRoom: Room) {
  const featuredWorldsMap = useStateEvents(repoRoom, RepositoryEvents.FeaturedWorld);
  return [...featuredWorldsMap]
    .map(([eventId, stateEvent]) => stateEvent)
    .filter((stateEvent) => Object.keys(stateEvent.content).length > 0);
}

export function FeaturedWorldsProvider({
  room,
  children,
}: {
  room: Room;
  children: (featuredWorlds: StateEvent[]) => JSX.Element | null;
}) {
  const featuredWorlds = useFeaturedWorlds(room);
  return children(featuredWorlds);
}
