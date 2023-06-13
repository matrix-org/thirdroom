import { Raycaster, Intersection, Vector3, Matrix4 } from "three";

import { defineModule, getModule, Thread } from "../module/module.common";
import { RenderThreadState, RendererModule } from "../renderer/renderer.render";
import { InputModule } from "../input/input.render";
import {
  InitRaycasterMessage,
  RaycasterMessageType,
  raycasterStateSchema,
  RaycasterStateTripleBuffer,
} from "./raycaster.common";
import {
  createObjectTripleBuffer,
  getWriteObjectBufferView,
  getReadObjectBufferView,
} from "../allocator/ObjectBufferView";

/*********
 * Types *
 *********/

export interface RaycasterModuleState {
  raycaster: Raycaster;
  intersections: Intersection[];
  sharedRaycasterState: RaycasterStateTripleBuffer;
}

/******************
 * Initialization *
 ******************/

export const RaycasterModule = defineModule<RenderThreadState, RaycasterModuleState>({
  name: "raycaster",
  create(ctx, { sendMessage, waitForMessage }) {
    const sharedRaycasterState = createObjectTripleBuffer(raycasterStateSchema, ctx.renderToGameTripleBufferFlags);

    sendMessage<InitRaycasterMessage>(Thread.Game, RaycasterMessageType.InitRaycaster, {
      sharedRaycasterState,
    });

    return {
      raycaster: new Raycaster(),
      intersections: [],
      sharedRaycasterState,
    };
  },
  init(ctx) {},
});

const _tempMatrix = new Matrix4();
const _tempOrigin = new Vector3();
const _tempDirection = new Vector3();
const _screenCoords = { x: 0, y: 0 };

export function RaycasterSystem(ctx: RenderThreadState) {
  const { raycaster, intersections, sharedRaycasterState } = getModule(ctx, RaycasterModule);
  const { scene, renderer } = getModule(ctx, RendererModule);
  const { screenSpaceMouseCoords } = getModule(ctx, InputModule);
  const { activeCameraNode, activeLeftControllerNode, activeRightControllerNode } = ctx.worldResource;
  const isPresenting = renderer.xr.isPresenting;

  if (!activeCameraNode?.cameraObject) {
    return;
  }

  if (isPresenting && (activeLeftControllerNode || activeRightControllerNode)) {
    const worldMatrix = activeRightControllerNode?.worldMatrix || activeLeftControllerNode?.worldMatrix;
    _tempMatrix.fromArray(worldMatrix!);
    _tempOrigin.setFromMatrixPosition(_tempMatrix);
    _tempDirection.set(0, 0, -1);
    _tempDirection.applyMatrix4(_tempMatrix);
    raycaster.set(_tempOrigin, _tempDirection);
  } else {
    const readView = getReadObjectBufferView(screenSpaceMouseCoords);
    _screenCoords.x = readView.coords[0];
    _screenCoords.y = readView.coords[1];
    raycaster.setFromCamera(_screenCoords, activeCameraNode.cameraObject);
  }

  intersections.length = 0;
  raycaster.intersectObject(scene, true, intersections);

  let nodeId = 0;

  if (intersections.length > 0) {
    nodeId = intersections[0].object.userData.nodeId;
  }

  const writeView = getWriteObjectBufferView(sharedRaycasterState);
  writeView.intersectionNodeId[0] = nodeId;
}
