import { quat, vec3 } from "gl-matrix";

import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  HandJointNameToIndex,
  InitializeInputStateMessage,
  InputComponentState,
  InputMessageType,
  InputSourceId,
  SetXRReferenceSpaceMessage,
  SharedXRInputSource,
  UpdateXRInputSourcesMessage,
  XRCameraPoseSchema,
  XRCameraPoseTripleBuffer,
  XRControllerPosesSchema,
  XRControllerPosesTripleBuffer,
  XRHandPosesSchema,
  XRHandPosesTripleBuffer,
  XRToInputComponentId,
} from "./input.common";
import { enqueueInputRingBuffer, InputRingBuffer } from "./RingBuffer";
import { createObjectTripleBuffer, getWriteObjectBufferView } from "../allocator/ObjectBufferView";
import {
  updateComponentValuesFromGamepad,
  XRInputComponentId,
  XRInputLayout,
  XRInputProfileManager,
} from "./WebXRInputProfiles";
import { createDisposables } from "../utils/createDisposables";
import { domPointToQuat, domPointToVec3, getYaw, quatToDOMPoint, RAD2DEG, vec3ToDOMPoint } from "../component/math";

/*********
 * Types *
 ********/

interface XRInputSourceItem {
  id: number;
  inputSource: XRInputSource;
  layout: XRInputLayout;
  controllerPoses: XRControllerPosesTripleBuffer;
  handPoses?: XRHandPosesTripleBuffer;
}

export interface RenderInputModule {
  inputSourceItems: XRInputSourceItem[];
  inputRingBuffer: InputRingBuffer;
  inputProfileManager: XRInputProfileManager;
  cameraPose?: XRViewerPose;
  cameraPoseTripleBuffer: XRCameraPoseTripleBuffer;
  leftControllerPose?: XRPose;
  rightControllerPose?: XRPose;
  updateReferenceSpaceHand?: XRHandedness;
  originalReferenceSpace?: XRReferenceSpace;
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<RenderThreadState, RenderInputModule>({
  name: "input",
  async create(ctx, { waitForMessage }) {
    const { inputRingBuffer } = await waitForMessage<InitializeInputStateMessage>(
      Thread.Main,
      InputMessageType.InitializeInputState
    );

    const basePath = new URL("/webxr-input-profiles", import.meta.url);

    const cameraPoseTripleBuffer = createObjectTripleBuffer(XRCameraPoseSchema, ctx.renderToGameTripleBufferFlags);

    return {
      inputProfileManager: new XRInputProfileManager(basePath.href),
      inputSourceItems: [],
      inputRingBuffer,
      cameraPoseTripleBuffer,
    };
  },
  init(ctx) {
    const { renderer } = getModule(ctx, RendererModule);
    const input = getModule(ctx, InputModule);
    const { inputSourceItems, inputProfileManager, cameraPoseTripleBuffer } = input;

    let nextInputSourceId = Object.keys(InputSourceId).length;

    async function onXRInputSourcesChanged(event: XRInputSourceChangeEvent) {
      try {
        const items = await Promise.all(
          Array.from(event.added).map((inputSource) =>
            createXRInputSourceItem(ctx, inputProfileManager, nextInputSourceId++, inputSource)
          )
        );

        inputSourceItems.push(...items);

        const added: SharedXRInputSource[] = items.map(({ id, inputSource, layout, controllerPoses, handPoses }) => ({
          id,
          handedness: inputSource.handedness,
          layout,
          cameraPose: cameraPoseTripleBuffer,
          controllerPoses,
          handPoses,
        }));

        const removed: number[] = [];

        for (const inputSource of event.removed) {
          const index = inputSourceItems.findIndex((item) => item.inputSource === inputSource);

          if (index !== -1) {
            removed.push(inputSourceItems[index].id);
            inputSourceItems.splice(index, 1);
          }
        }

        ctx.sendMessage<UpdateXRInputSourcesMessage>(Thread.Game, {
          type: InputMessageType.UpdateXRInputSources,
          added,
          removed,
        });
      } catch (error) {
        console.error(error);
      }
    }

    async function onXRSessionStart() {
      try {
        const session = renderer.xr.getSession();

        if (session) {
          const items = await Promise.all(
            Array.from(session.inputSources).map((inputSource) =>
              createXRInputSourceItem(ctx, inputProfileManager, nextInputSourceId++, inputSource)
            )
          );

          inputSourceItems.push(...items);

          const added: SharedXRInputSource[] = items.map(({ id, inputSource, layout, controllerPoses, handPoses }) => ({
            id,
            handedness: inputSource.handedness,
            layout,
            cameraPose: cameraPoseTripleBuffer,
            controllerPoses,
            handPoses,
          }));

          ctx.sendMessage<UpdateXRInputSourcesMessage>(Thread.Game, {
            type: InputMessageType.UpdateXRInputSources,
            added,
            removed: [],
          });

          session.addEventListener("inputsourceschange", onXRInputSourcesChanged);
        }
      } catch (error) {
        console.error(error);
      }
    }

    function onXRSessionEnd() {
      const removed = inputSourceItems.map((source) => source.id);

      ctx.sendMessage<UpdateXRInputSourcesMessage>(Thread.Game, {
        type: InputMessageType.UpdateXRInputSources,
        added: [],
        removed,
      });

      inputSourceItems.length = 0;

      input.originalReferenceSpace = undefined;
    }

    renderer.xr.addEventListener("sessionstart", onXRSessionStart);
    renderer.xr.addEventListener("sessionend", onXRSessionEnd);

    const disposeSessionHandlers = () => {
      renderer.xr.removeEventListener("sessionstart", onXRSessionStart);
      renderer.xr.removeEventListener("sessionend", onXRSessionEnd);
    };

    return createDisposables([
      registerMessageHandler(ctx, InputMessageType.SetXRReferenceSpace, onSetXRReferenceSpace),
      disposeSessionHandlers,
    ]);
  },
});

function onSetXRReferenceSpace(ctx: RenderThreadState, message: SetXRReferenceSpaceMessage) {
  const inputModule = getModule(ctx, InputModule);
  inputModule.updateReferenceSpaceHand = message.hand;
}

async function createXRInputSourceItem(
  ctx: RenderThreadState,
  inputProfileManager: XRInputProfileManager,
  id: number,
  inputSource: XRInputSource
): Promise<XRInputSourceItem> {
  const profile = await inputProfileManager.fetchProfile(inputSource);

  const layout = profile.layouts[inputSource.handedness];

  if (!layout) {
    throw new Error(`No "${inputSource.handedness}" layout found for WebXR controller ${profile.profileId}`);
  }

  const assetPath = inputProfileManager.resolveAssetPath(`${profile.profileId}/${layout.assetPath}`);

  const modifiedLayout = { ...layout, assetPath };

  return {
    id,
    inputSource,
    layout: modifiedLayout,
    controllerPoses: createObjectTripleBuffer(XRControllerPosesSchema, ctx.renderToGameTripleBufferFlags),
    handPoses: inputSource.hand && createObjectTripleBuffer(XRHandPosesSchema, ctx.renderToGameTripleBufferFlags),
  };
}

const out: InputComponentState = {
  inputSourceId: 0,
  componentId: 0,
  button: 0,
  xAxis: 0,
  yAxis: 0,
  state: 0,
};

export function UpdateXRInputSourcesSystem(ctx: RenderThreadState) {
  const inputModule = getModule(ctx, InputModule);
  const { inputSourceItems, inputRingBuffer } = inputModule;
  const rendererModule = getModule(ctx, RendererModule);
  const renderer = rendererModule.renderer;

  inputModule.cameraPose = undefined;
  inputModule.leftControllerPose = undefined;
  inputModule.rightControllerPose = undefined;

  if (!renderer.xr.isPresenting) {
    return;
  }

  const frame = renderer.xr.getFrame();

  let referenceSpace = renderer.xr.getReferenceSpace();

  if (!referenceSpace) {
    return;
  }

  if (!inputModule.originalReferenceSpace) {
    inputModule.originalReferenceSpace = referenceSpace;
  }

  if (inputModule.updateReferenceSpaceHand) {
    const inputSourceItem = inputSourceItems.find(
      (item) => item.inputSource.handedness === inputModule.updateReferenceSpaceHand
    );

    const raySpace = inputSourceItem?.inputSource.targetRaySpace;

    if (raySpace) {
      const rayPose = frame.getPose(raySpace, inputModule.originalReferenceSpace);

      if (rayPose) {
        const position = domPointToVec3(vec3.create(), rayPose.transform.position);
        vec3.add(position, position, vec3.fromValues(0, 0, 0.05));

        const orientation = domPointToQuat(quat.create(), rayPose.transform.orientation);
        const yRotation = getYaw(orientation);
        const yOrientation = quat.fromEuler(quat.create(), 0, yRotation * RAD2DEG, 0);

        const offsetTransform = new XRRigidTransform(vec3ToDOMPoint(position), quatToDOMPoint(yOrientation));
        referenceSpace = inputModule.originalReferenceSpace.getOffsetReferenceSpace(offsetTransform);
        renderer.xr.setReferenceSpace(referenceSpace);
      }
    }

    inputModule.updateReferenceSpaceHand = undefined;
  }

  inputModule.cameraPose = frame.getViewerPose(referenceSpace);

  if (inputModule.cameraPose) {
    const cameraPoseView = getWriteObjectBufferView(inputModule.cameraPoseTripleBuffer);
    cameraPoseView.matrix.set(inputModule.cameraPose.transform.matrix);
  }

  for (const { id: inputSourceId, inputSource, layout, controllerPoses, handPoses } of inputSourceItems) {
    const components = layout.components;
    const { gamepad, hand } = inputSource;

    if (gamepad) {
      for (const componentName in components) {
        const componentIdName = componentName as XRInputComponentId;
        const component = components[componentIdName];

        if (component) {
          const componentId = XRToInputComponentId[componentIdName];
          updateComponentValuesFromGamepad(component, gamepad, out);

          if (
            !enqueueInputRingBuffer(
              inputRingBuffer,
              inputSourceId,
              componentId,
              out.button,
              out.xAxis,
              out.yAxis,
              out.state
            )
          ) {
            console.warn("input ring buffer full");
          }
        }
      }
    }

    const controllerPosesView = getWriteObjectBufferView(controllerPoses);

    // Ray pose is where the ray should be positioned/oriented
    const rayPose = frame.getPose(inputSource.targetRaySpace, referenceSpace);

    if (rayPose) {
      controllerPosesView.rayPose.set(rayPose.transform.matrix);
    }

    if (inputSource.gripSpace) {
      // Grip pose is where the controller model should be rooted
      const gripPose = frame.getPose(inputSource.gripSpace, referenceSpace);

      if (gripPose) {
        controllerPosesView.gripPose.set(gripPose.transform.matrix);

        if (inputSource.handedness === "left") {
          inputModule.leftControllerPose = gripPose;
        } else if (inputSource.handedness === "right") {
          inputModule.rightControllerPose = gripPose;
        }
      }
    }

    if (hand && frame.getJointPose && handPoses) {
      const handPosesView = getWriteObjectBufferView(handPoses);

      for (const [jointName, jointSpace] of hand.entries()) {
        const jointPose = frame.getJointPose(jointSpace, referenceSpace);

        if (jointPose) {
          const index = HandJointNameToIndex[jointName as unknown as string];
          handPosesView.matrices[index].set(jointPose.transform.matrix);
          handPosesView.radii[index] = jointPose.radius || 0;
        }
      }
    }
  }
}
