import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  HandJointNameToIndex,
  InitializeInputStateMessage,
  InputComponentState,
  InputMessageType,
  InputSourceId,
  SharedXRInputSource,
  UpdateXRInputSourcesMessage,
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
  leftControllerPose?: XRPose;
  rightControllerPose?: XRPose;
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

    return {
      inputProfileManager: new XRInputProfileManager(basePath.href),
      inputSourceItems: [],
      inputRingBuffer,
    };
  },
  init(ctx) {
    const { renderer } = getModule(ctx, RendererModule);
    const input = getModule(ctx, InputModule);
    const { inputSourceItems, inputProfileManager } = input;

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
    }

    renderer.xr.addEventListener("sessionstart", onXRSessionStart);
    renderer.xr.addEventListener("sessionend", onXRSessionEnd);

    return () => {
      renderer.xr.removeEventListener("sessionstart", onXRSessionStart);
      renderer.xr.removeEventListener("sessionend", onXRSessionEnd);
    };
  },
});

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

  const referenceSpace = renderer.xr.getReferenceSpace();

  if (!referenceSpace) {
    return;
  }

  inputModule.cameraPose = frame.getViewerPose(referenceSpace);

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
