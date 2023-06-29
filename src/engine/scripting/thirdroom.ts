import { ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { ThirdRoomModule } from "../../plugins/thirdroom/thirdroom.game";
import { moveCursorView } from "../allocator/CursorView";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { FREQ_BIN_COUNT } from "../audio/audio.common";
import { AudioModule } from "../audio/audio.game";
import { GameContext } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { EnableMatrixMaterialMessage, RendererMessageType, XRMode } from "../renderer/renderer.common";
import { getXRMode } from "../renderer/renderer.game";
import { RemoteImage } from "../resource/RemoteResources";
import { getRemoteImageUrl } from "../utils/getRemoteImageUrl";
import {
  readList,
  readResourceRef,
  readStringFromCursorView,
  WASMModuleContext,
  writeEncodedString,
  writeString,
  writeUint8Array,
} from "./WASMModuleContext";

export function createThirdroomModule(ctx: GameContext, wasmCtx: WASMModuleContext) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  const thirdroomModule = {
    get_js_source_size() {
      return wasmCtx.encodedJSSource ? wasmCtx.encodedJSSource.byteLength + 1 : 0;
    },
    get_js_source(destPtr: number) {
      try {
        if (!wasmCtx.encodedJSSource) {
          console.error("Thirdroom: No JS source set.");
          return -1;
        }

        return writeEncodedString(wasmCtx, destPtr, wasmCtx.encodedJSSource);
      } catch (error) {
        console.error("Thirdroom: Error getting JS source:", error);
        return -1;
      }
    },
    enable_matrix_material(enabled: number) {
      ctx.sendMessage<EnableMatrixMaterialMessage>(Thread.Render, {
        type: RendererMessageType.EnableMatrixMaterial,
        enabled: !!enabled,
      });
    },
    get_audio_data_size() {
      return FREQ_BIN_COUNT;
    },
    get_audio_frequency_data(audioDataPtr: number) {
      const audio = getModule(ctx, AudioModule);
      const { frequencyData } = getReadObjectBufferView(audio.analyserTripleBuffer);
      return writeUint8Array(wasmCtx, audioDataPtr, frequencyData);
    },
    get_audio_time_data(audioDataPtr: number) {
      const audio = getModule(ctx, AudioModule);
      const { timeData } = getReadObjectBufferView(audio.analyserTripleBuffer);
      return writeUint8Array(wasmCtx, audioDataPtr, timeData);
    },
    in_ar() {
      const ourXRMode = getXRMode(ctx);
      const sceneSupportsAR = ctx.worldResource.environment?.publicScene.supportsAR || false;
      return ourXRMode === XRMode.ImmersiveAR && sceneSupportsAR ? 1 : 0;
    },
    action_bar_set_items(itemsPtr: number) {
      try {
        thirdroom.actionBarItems.length = 0;

        moveCursorView(wasmCtx.cursorView, itemsPtr);
        readList(wasmCtx, () => {
          const id = readStringFromCursorView(wasmCtx);
          const label = readStringFromCursorView(wasmCtx);
          const thumbnail = readResourceRef(wasmCtx, RemoteImage);

          if (!thumbnail) {
            throw new Error("Thirdroom: No thumbnail set for action bar item");
          }

          thirdroom.actionBarItems.push({
            id,
            label,
            thumbnail: getRemoteImageUrl(thumbnail),
          });
        });

        ctx.sendMessage(Thread.Main, {
          type: ThirdRoomMessageType.SetActionBarItems,
          actionBarItems: thirdroom.actionBarItems,
        });

        return 0;
      } catch (error) {
        console.error("Thirdroom: Error setting action bar items:", error);
        return -1;
      }
    },
    action_bar_create_listener() {
      const id = wasmCtx.resourceManager.nextActionBarListenerId++;

      wasmCtx.resourceManager.actionBarListeners.push({
        id,
        actions: [],
      });

      return id;
    },
    action_bar_listener_dispose(listenerId: number) {
      const actionBarListeners = wasmCtx.resourceManager.actionBarListeners;
      const index = actionBarListeners.findIndex((l) => l.id === listenerId);

      if (index === -1) {
        console.error("Thirdroom: No action bar listener with id", listenerId);
        return -1;
      }

      actionBarListeners.splice(index, 1);

      return 0;
    },
    action_bar_listener_get_next_action_length(listenerId: number) {
      const listener = wasmCtx.resourceManager.actionBarListeners.find((l) => l.id === listenerId);

      if (!listener) {
        console.error("Thirdroom: No action bar listener with id", listenerId);
        return -1;
      }

      if (listener.actions.length === 0) {
        return 0;
      }

      const action = listener.actions[0];

      return action.length;
    },
    action_bar_listener_get_next_action(listenerId: number, idPtr: number) {
      const listener = wasmCtx.resourceManager.actionBarListeners.find((l) => l.id === listenerId);

      if (!listener) {
        console.error("Thirdroom: No action bar listener with id", listenerId);
        return -1;
      }

      const action = listener.actions.shift();

      if (action) {
        writeString(wasmCtx, idPtr, action);
      }

      return listener.actions.length;
    },
  };

  const disposeThirdroomModule = () => {
    wasmCtx.resourceManager.actionBarListeners.length = 0;
    wasmCtx.resourceManager.nextActionBarListenerId = 1;
  };

  return [thirdroomModule, disposeThirdroomModule] as const;
}
