import { defineModule, Thread, getModule } from "../module/module.common";
import { GameState } from "../GameTypes";
import { RaycasterMessageType, InitRaycasterMessage, RaycasterStateTripleBuffer } from "./raycaster.common";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { InputModule } from "../input/input.game";
import { getRemoteResource } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";
import { ButtonActionState } from "../input/ActionMap";
import { selectEditorEntity } from "../editor/editor.game";

/*********
 * Types *
 *********/

interface RaycasterModuleState {
  sharedRaycasterState: RaycasterStateTripleBuffer;
}

/******************
 * Initialization *
 ******************/

export const RaycasterModule = defineModule<GameState, RaycasterModuleState>({
  name: "raycaster",
  async create(ctx, { sendMessage, waitForMessage }) {
    const { sharedRaycasterState } = await waitForMessage<InitRaycasterMessage>(
      Thread.Render,
      RaycasterMessageType.InitRaycaster
    );

    return {
      sharedRaycasterState,
    };
  },
  init(ctx) {},
});

export function RaycasterSystem(ctx: GameState) {
  const { sharedRaycasterState } = getModule(ctx, RaycasterModule);
  const { activeController } = getModule(ctx, InputModule);

  const readView = getReadObjectBufferView(sharedRaycasterState);

  const grabBtn = activeController.actionStates.get("Grab") as ButtonActionState;

  if (grabBtn?.pressed) {
    const node = getRemoteResource<RemoteNode>(ctx, readView.intersectionNodeId[0]);

    selectEditorEntity(ctx, node?.eid || 0);
  }
}
