import { useEffect, useState } from "react";

import { IMainThreadContext } from "../../engine/MainThread";
import { getModule, registerMessageHandler } from "../../engine/module/module.common";
import { getLocalResource, MainImage } from "../../engine/resource/resource.main";
import { toArrayBuffer } from "../../engine/utils/arraybuffer";
import {
  ActionBarItem,
  SetActionBarItemsMessage,
  ThirdRoomMessageType,
} from "../../plugins/thirdroom/thirdroom.common";
import { ThirdroomModule } from "../../plugins/thirdroom/thirdroom.main";
import { useMainThreadContext } from "./useMainThread";

export interface ActionBarViewItem {
  id: string;
  label: string;
  thumbnail: string;
}

function loadImage(ctx: IMainThreadContext, imageId: number) {
  const image = getLocalResource<MainImage>(ctx, imageId);

  if (!image) {
    return "";
  }

  if (image.uri) {
    return image.uri;
  }

  if (image.bufferView) {
    const bufferView = image.bufferView;
    const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);
    const blob = new Blob([buffer], { type: image.mimeType });
    return URL.createObjectURL(blob);
  }

  return "";
}

function toActionBarViewItems(ctx: IMainThreadContext, actionBarItems: ActionBarItem[]): ActionBarViewItem[] {
  return actionBarItems.map(({ id, label, thumbnail }) => ({
    id,
    label,
    thumbnail: loadImage(ctx, thumbnail),
  }));
}

export function useActionBar() {
  const mainThread = useMainThreadContext();
  const [actionBarItems, setActionBarItems] = useState<ActionBarViewItem[]>([]);

  useEffect(() => {
    const { actionBarItems } = getModule(mainThread, ThirdroomModule);
    setActionBarItems(toActionBarViewItems(mainThread, actionBarItems));

    return registerMessageHandler(
      mainThread,
      ThirdRoomMessageType.SetActionBarItems,
      (ctx, message: SetActionBarItemsMessage) => {
        setActionBarItems(toActionBarViewItems(ctx, message.actionBarItems));
      }
    );
  }, [mainThread]);

  return actionBarItems;
}
