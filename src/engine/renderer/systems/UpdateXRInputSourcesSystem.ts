import { vec3, quat } from "gl-matrix";
import { RAD2DEG } from "three/src/math/MathUtils";

import { getWriteObjectBufferView } from "../../allocator/ObjectBufferView";
import { domPointToVec3, domPointToQuat, getYaw, vec3ToDOMPoint, quatToDOMPoint } from "../../common/math";
import { InputComponentState, InputComponentId, XRInputComponentId } from "../../input/input.common";
import { enqueueInputRingBuffer } from "../../common/InputRingBuffer";
import { updateComponentValuesFromGamepad } from "../xr/WebXRInputProfiles";
import { getModule } from "../../module/module.common";
import { RenderContext, RendererModule, XRInputSourceItem } from "../renderer.render";

const out: InputComponentState = {
  inputSourceId: 0,
  componentId: 0,
  button: 0,
  xAxis: 0,
  yAxis: 0,
  zAxis: 0,
  wAxis: 0,
  state: 0,
};

const HandJointNameToIndex: { [key: string]: number } = {
  wrist: 0,
  "thumb-metacarpal": 1,
  "thumb-phalanx-proximal": 2,
  "thumb-phalanx-distal": 3,
  "thumb-tip": 4,
  "index-finger-metacarpal": 5,
  "index-finger-phalanx-proximal": 6,
  "index-finger-phalanx-intermediate": 7,
  "index-finger-phalanx-distal": 8,
  "index-finger-tip": 9,
  "middle-finger-metacarpal": 10,
  "middle-finger-phalanx-proximal": 11,
  "middle-finger-phalanx-intermediate": 12,
  "middle-finger-phalanx-distal": 13,
  "middle-finger-tip": 14,
  "ring-finger-metacarpal": 15,
  "ring-finger-phalanx-proximal": 16,
  "ring-finger-phalanx-intermediate": 17,
  "ring-finger-phalanx-distal": 18,
  "ring-finger-tip": 19,
  "pinky-finger-metacarpal": 20,
  "pinky-finger-phalanx-proximal": 21,
  "pinky-finger-phalanx-intermediate": 22,
  "pinky-finger-phalanx-distal": 23,
  "pinky-finger-tip": 24,
};

const XRToInputComponentId = {
  [XRInputComponentId.FaceButton]: InputComponentId.XRFaceButton,
  [XRInputComponentId.XRStandardTrigger]: InputComponentId.XRStandardTrigger,
  [XRInputComponentId.XRStandardSqueeze]: InputComponentId.XRStandardSqueeze,
  [XRInputComponentId.XRStandardThumbstick]: InputComponentId.XRStandardThumbstick,
  [XRInputComponentId.XRStandardTouchpad]: InputComponentId.XRStandardTouchpad,
  [XRInputComponentId.Grasp]: InputComponentId.XRHandGrasp,
  [XRInputComponentId.Touchpad]: InputComponentId.XRTouchpad,
  [XRInputComponentId.Touchscreen]: InputComponentId.XRTouchscreen,
  [XRInputComponentId.XButton]: InputComponentId.XRXButton,
  [XRInputComponentId.YButton]: InputComponentId.XRYButton,
  [XRInputComponentId.AButton]: InputComponentId.XRAButton,
  [XRInputComponentId.BButton]: InputComponentId.XRBButton,
  [XRInputComponentId.Bumper]: InputComponentId.XRBumper,
  [XRInputComponentId.Thumbrest]: InputComponentId.XRThumbrest,
  [XRInputComponentId.Menu]: InputComponentId.XRMenu,
};

export function UpdateXRInputSourcesSystem(ctx: RenderContext) {
  const rendererModule = getModule(ctx, RendererModule);
  const { inputSourceItems, inputRingBuffer, renderer } = rendererModule;

  rendererModule.cameraPose = undefined;
  rendererModule.leftControllerPose = undefined;
  rendererModule.rightControllerPose = undefined;

  if (!renderer.xr.isPresenting) {
    return;
  }

  const frame = renderer.xr.getFrame();

  let referenceSpace = renderer.xr.getReferenceSpace();

  if (!referenceSpace) {
    return;
  }

  if (!rendererModule.originalReferenceSpace) {
    rendererModule.originalReferenceSpace = referenceSpace;
  }

  if (rendererModule.updateReferenceSpaceHand) {
    const inputSourceItem = getInputSourceItem(inputSourceItems, rendererModule.updateReferenceSpaceHand);

    const raySpace = inputSourceItem?.inputSource.targetRaySpace;

    if (raySpace) {
      const rayPose = frame.getPose(raySpace, rendererModule.originalReferenceSpace);

      if (rayPose) {
        const position = domPointToVec3(vec3.create(), rayPose.transform.position);
        vec3.add(position, position, vec3.fromValues(0, 0, 0.05));

        const orientation = domPointToQuat(quat.create(), rayPose.transform.orientation);
        const yRotation = getYaw(orientation);
        const yOrientation = quat.fromEuler(quat.create(), 0, yRotation * RAD2DEG, 0);

        const offsetTransform = new XRRigidTransform(vec3ToDOMPoint(position), quatToDOMPoint(yOrientation));
        referenceSpace = rendererModule.originalReferenceSpace.getOffsetReferenceSpace(offsetTransform);
        renderer.xr.setReferenceSpace(referenceSpace);
      }
    }

    rendererModule.updateReferenceSpaceHand = undefined;
  }

  rendererModule.cameraPose = frame.getViewerPose(referenceSpace);

  if (rendererModule.cameraPose) {
    const cameraPoseView = getWriteObjectBufferView(rendererModule.cameraPoseTripleBuffer);
    cameraPoseView.matrix.set(rendererModule.cameraPose.transform.matrix);
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
              out.zAxis,
              out.wAxis,
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
          rendererModule.leftControllerPose = gripPose;
        } else if (inputSource.handedness === "right") {
          rendererModule.rightControllerPose = gripPose;
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

function getInputSourceItem(inputSourceItems: XRInputSourceItem[], handedness: XRHandedness | undefined) {
  for (let i = 0; i < inputSourceItems.length; i++) {
    const inputSourceItem = inputSourceItems[i];

    if (inputSourceItems[i].inputSource.handedness === handedness) {
      return inputSourceItem;
    }
  }

  return undefined;
}
