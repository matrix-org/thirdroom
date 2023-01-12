import { Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";

import { useStateEvents } from "../../hooks/useStateEvents";
import { RepositoryEvents } from "../session/discover/DiscoverView";

export function useFeaturedScenes(repoRoom: Room) {
  const featuredScenesMap = useStateEvents(repoRoom, RepositoryEvents.FeaturedScene);
  return [...featuredScenesMap]
    .map(([eventId, stateEvent]) => stateEvent)
    .filter((stateEvent) => Object.keys(stateEvent.content).length > 0);
}

export function FeaturedScenesProvider({
  room,
  children,
}: {
  room: Room;
  children: (featuredScenes: StateEvent[]) => JSX.Element | null;
}) {
  const featuredScenes = useFeaturedScenes(room);
  return children(featuredScenes);
}
