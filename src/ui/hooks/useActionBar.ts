import { useEffect, useState } from "react";

import { getModule, registerMessageHandler } from "../../engine/module/module.common";
import {
  ActionBarItem,
  SetActionBarItemsMessage,
  ThirdRoomMessageType,
} from "../../plugins/thirdroom/thirdroom.common";
import { ThirdroomModule } from "../../plugins/thirdroom/thirdroom.main";
import { useMainThreadContext } from "./useMainThread";

export function useActionBar() {
  const mainThread = useMainThreadContext();
  const [actionBarItems, setActionBarItems] = useState<ActionBarItem[]>([]);

  useEffect(() => {
    const { actionBarItems } = getModule(mainThread, ThirdroomModule);
    setActionBarItems(actionBarItems);

    return registerMessageHandler(
      mainThread,
      ThirdRoomMessageType.SetActionBarItems,
      (ctx, message: SetActionBarItemsMessage) => {
        setActionBarItems(message.actionBarItems);
      }
    );
  }, [mainThread]);

  return actionBarItems;
}
