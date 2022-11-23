import { Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";

import { useStateEvents } from "../../hooks/useStateEvents";
import { RepositoryEvents } from "../session/discover/DiscoverView";

export function useFeaturedWorlds(repoRoom: Room) {
  const featuredWorldsMap = useStateEvents(repoRoom, RepositoryEvents.FeaturedWorlds);
  return [...featuredWorldsMap].filter(([eventId, stateEvent]) => Object.keys(stateEvent.content).length > 0);
}

export function FeaturedWorldsProvider({
  room,
  children,
}: {
  room: Room;
  children: (featuredWorlds: [string, StateEvent][]) => JSX.Element | null;
}) {
  const featuredWorlds = useFeaturedWorlds(room);
  return children(featuredWorlds);
}
