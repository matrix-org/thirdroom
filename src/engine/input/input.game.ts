import { ourPlayerQuery } from "../player/Player";
import { GameContext } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { getCamera } from "../player/getCamera";
import { XRMode } from "../renderer/renderer.common";
import { getXRMode } from "../renderer/renderer.game";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import { ActionMap, ActionState } from "./ActionMap";
import { enableActionMap } from "./ActionMappingSystem";
import { InitializeInputStateMessage, InputMessageType } from "./input.common";
import { InputRingBuffer } from "../common/InputRingBuffer";
import { ARActionMap, XRAvatarRig } from "./WebXRAvatarRigSystem";

/*********
 * Types *
 ********/

export interface GameInputModule {
  inputRingBuffer: InputRingBuffer;
  actionStates: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<GameContext, GameInputModule>({
  name: "input",
  async create(ctx, { waitForMessage }) {
    const { inputRingBuffer } = await waitForMessage<InitializeInputStateMessage>(
      Thread.Main,
      InputMessageType.InitializeInputState
    );

    return {
      inputRingBuffer,
      actionMaps: [],
      actionStates: new Map(),
      raw: {},
    };
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    // TODO: we should enable / disable this depending on whether or not you're in XR
    enableActionMap(input, ARActionMap);
  },
});

export function getPrimaryInputSourceNode(ctx: GameContext) {
  const ourPlayer = ourPlayerQuery(ctx.world)[0];
  const xrRig = getXRMode(ctx) !== XRMode.None ? XRAvatarRig.get(ourPlayer) : undefined;
  const rightRayNode = xrRig && xrRig.rightRayEid && tryGetRemoteResource<RemoteNode>(ctx, xrRig.rightRayEid);

  if (rightRayNode) {
    return rightRayNode;
  } else {
    const playerNode = getRemoteResource<RemoteNode>(ctx, ourPlayer) as RemoteNode;
    return getCamera(ctx, playerNode).parent as RemoteNode;
  }
}
