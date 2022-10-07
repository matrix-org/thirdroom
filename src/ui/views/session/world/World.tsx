import { useOutletContext } from "react-router-dom";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { SessionOutletContext } from "../SessionView";
import { WorldThumbnail } from "./WorldThumbnail";
import { WorldView } from "./WorldView";

export default function World() {
  const { session } = useHydrogen(true);
  const { world, activeCall } = useOutletContext<SessionOutletContext>();
  const { isEnteredWorld } = useStore((state) => state.world);
  const joinedWorld = world ? session.rooms.get(world.id) : undefined;

  return (
    <>
      {joinedWorld && isEnteredWorld && activeCall && <WorldView world={joinedWorld} activeCall={activeCall} />}
      <WorldThumbnail />
    </>
  );
}
