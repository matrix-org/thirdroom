import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { RoomVisibility } from "@thirdroom/hydrogen-view-sdk";

import { useWhatsNew } from "../../../hooks/useWhatsNew";
import { WhatsNewModal } from "./WhatsNewModal";
import { webSGTutDialogAtom, whatsNewDialogAtom } from "../../../state/whatsNew";
import { WebSceneGraphDialog } from "./special/WebSceneGraphDialog";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { CreateWorldOptions, createWorld } from "../create-world/CreateWorldForm";
import { waitToCreateRoom } from "../../../utils/matrixUtils";
import { MAX_OBJECT_CAP } from "../../../../engine/config.common";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { worldAtom } from "../../../state/world";
import { useWorldNavigator } from "../../../hooks/useWorldNavigator";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useRoom } from "../../../hooks/useRoom";

const WEBSG_ROOM_ID = "WebSG_roomId";

const SCRIPTING_WORLD: CreateWorldOptions = {
  name: "Scripting World",
  visibility: RoomVisibility.Private,
  content: {
    // FIXME: update mxc before merge
    scene_url: "mxc://thirdroom.io/txYUeQFaBxHnOvCKIMmkCqxX",
    scene_preview_url: "mxc://thirdroom.io/YokViVMnwUvGTJRvfIFqtOgO",
    max_member_object_cap: MAX_OBJECT_CAP,
  },
};

export function WhatsNew() {
  const { whatsNew /*finishWhatsNew*/ } = useWhatsNew();
  const [whatsNewDialog, setWhatsNewDialog] = useAtom(whatsNewDialogAtom);
  const [webSGTutDialog, setWebSGTutDialog] = useAtom(webSGTutDialogAtom);
  const { session } = useHydrogen(true);
  const setSelectedWorld = useSetAtom(overlayWorldAtom);
  const { navigateEnterWorld } = useWorldNavigator(session);
  const { worldId, entered } = useAtomValue(worldAtom);
  const [webSGRoomId, storeWebSGRoomId] = useLocalStorage<string | undefined>(WEBSG_ROOM_ID, undefined);
  const webSGRoom = useRoom(session, webSGRoomId);

  useEffect(() => {
    if (whatsNewDialog === undefined && whatsNew && !worldId) {
      setWhatsNewDialog(true);
    }
  }, [whatsNewDialog, whatsNew, setWhatsNewDialog, worldId]);

  useEffect(() => {
    if (whatsNew && worldId === webSGRoomId && entered) {
      setWebSGTutDialog(true);
    }
  }, [worldId, webSGRoomId, entered, whatsNew, setWebSGTutDialog]);

  const handleCreateSpecialWorld = async () => {
    setWhatsNewDialog(false);
    if (webSGRoom) {
      setSelectedWorld(webSGRoom.id);
      navigateEnterWorld(webSGRoom);
      return;
    }
    try {
      const roomBeingCreated = await createWorld(session, SCRIPTING_WORLD);
      setSelectedWorld(roomBeingCreated.id);
      const room = await waitToCreateRoom(session, roomBeingCreated);
      if (room) {
        storeWebSGRoomId(room.id);
        setSelectedWorld(room.id);
        navigateEnterWorld(room);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <WhatsNewModal
        open={!!whatsNewDialog}
        requestClose={() => setWhatsNewDialog(false)}
        createSpecialWorld={handleCreateSpecialWorld}
      />
      <WebSceneGraphDialog
        open={webSGTutDialog}
        requestClose={() => {
          // TODO: open webSG tutorial in new window
          setWebSGTutDialog(false);
          // TODO: Call finishWhatsNew() here before merging PR
        }}
      />
    </>
  );
}
