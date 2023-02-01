/**
 *
 * Adapted from https://github.com/immersive-web/webxr-input-profiles/tree/main/packages/motion-controllers
 *
 * MIT License
 *
 * Copyright (c) 2019 Amazon
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice (including the next
 * paragraph) shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
 * OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import { clamp } from "../utils/interpolation";
import { InputComponentState } from "./input.common";

export enum XRInputComponentState {
  Default = "default",
  Touched = "touched",
  Pressed = "pressed",
}

export enum XRInputComponentProperty {
  Button = "button",
  XAxis = "xAxis",
  YAxis = "yAxis",
  State = "state",
}

export enum XRVisualResponseProperty {
  Transform = "transform",
  Visibility = "visibility",
}

export interface XRInputVisualResponse {
  valueNodeName: string;
  minNodeName?: string;
  maxNodeName?: string;
  componentProperty: XRInputComponentProperty;
  states: XRInputComponentState[];
  valueNodeProperty: string;
}

export enum XRInputComponentType {
  Trigger = "trigger",
  Squeeze = "squeeze",
  Touchpad = "touchpad",
  Thumbstick = "thumbstick",
  Button = "button",
}

export interface XRInputComponent {
  type: XRInputComponentType;
  gamepadIndices: {
    button?: number;
    xAxis?: number;
    yAxis?: number;
  };
  rootNodeName: string; // componentId.replace(/-/g, '_')
  visualResponses: { [key: string]: XRInputVisualResponse };
  touchPointNodeName?: string;
}

export enum XRInputComponentId {
  FaceButton = "face-button",
  XRStandardTrigger = "xr-standard-trigger",
  XRStandardSqueeze = "xr-standard-squeeze",
  XRStandardThumbstick = "xr-standard-thumbstick",
  XRStandardTouchpad = "xr-standard-touchpad",
  Grasp = "grasp",
  Touchpad = "touchpad",
  Touchscreen = "touchscreen",
  XButton = "x-button",
  YButton = "y-button",
  AButton = "a-button",
  BButton = "b-button",
  Bumper = "bumper",
  Thumbrest = "thumbrest",
  Menu = "menu",
}

export interface XRInputLayout {
  selectComponentId: XRInputComponentId;
  components: {
    [Prop in XRInputComponentId]?: XRInputComponent;
  };
  gamepadMapping: "xr-standard" | "";
  rootNodeName: string; // `${profileId}-${handedness}`
  assetPath: string; // `${handedness}.glb`
}

export enum XRInputHandedness {
  None = "none",
  Left = "left",
  Right = "right",
}

export interface XRInputProfile {
  profileId: string;
  fallbackProfileIds: string[];
  layouts: {
    [Prop in XRInputHandedness]?: XRInputLayout;
  };
}

export type XRProfilesList = { [key: string]: { path: string; deprecated?: boolean } };

export class XRInputProfileManager {
  private profilesListPromise?: Promise<XRProfilesList>;
  private profilePromises = new Map<string, Promise<XRInputProfile>>();

  constructor(private basePath: string) {}

  private async loadJSON<T>(path: string): Promise<T> {
    const url = this.resolveAssetPath(path);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  }

  private async fetchProfilesList() {
    if (!this.profilesListPromise) {
      this.profilesListPromise = this.loadJSON("profilesList.json");
    }

    return this.profilesListPromise;
  }

  async fetchProfile(inputSource: XRInputSource) {
    const profileList = await this.fetchProfilesList();

    let profilePath: string | undefined;

    for (const profileName of inputSource.profiles) {
      const profileListItem = profileList[profileName];

      if (profileListItem) {
        profilePath = profileListItem.path;
        break;
      }
    }

    if (!profilePath) {
      throw new Error(`Couldn't find any profiles for WebXR input source."`);
    }

    let profilePromise = this.profilePromises.get(profilePath);

    if (!profilePromise) {
      profilePromise = this.loadJSON(profilePath);
      this.profilePromises.set(profilePath, profilePromise);
    }

    return profilePromise;
  }

  resolveAssetPath(assetPath: string): string {
    return `${this.basePath}/${assetPath}`;
  }
}

export enum XRInputComponentStateValue {
  Default,
  Touched,
  Pressed,
}

const ValueToXRInputComponentState: { [key: number]: XRInputComponentState } = {
  [XRInputComponentStateValue.Default]: XRInputComponentState.Default,
  [XRInputComponentStateValue.Touched]: XRInputComponentState.Touched,
  [XRInputComponentStateValue.Pressed]: XRInputComponentState.Pressed,
};

export function getComponentVisualResponse(
  { componentProperty, states }: XRInputVisualResponse,
  component: InputComponentState
): number {
  const { button, xAxis, yAxis, state: stateValue } = component;
  const state = ValueToXRInputComponentState[stateValue];
  const validState = states.includes(state);

  if (componentProperty === XRInputComponentProperty.XAxis || componentProperty === XRInputComponentProperty.YAxis) {
    /**
     * Converts an X, Y coordinate from the range -1 to 1 (as reported by the Gamepad
     * API) to the range 0 to 1 (for interpolation). Also caps the X, Y values to be bounded within
     * a circle. This ensures that thumbsticks are not animated outside the bounds of their physical
     * range of motion and touchpads do not report touch locations off their physical bounds.
     **/

    let normalizedXAxis = xAxis;
    let normalizedYAxis = yAxis;

    // Determine if the point is outside the bounds of the circle
    // and, if so, place it on the edge of the circle
    const hypotenuse = Math.sqrt(xAxis * xAxis + yAxis * yAxis);

    if (hypotenuse > 1) {
      const theta = Math.atan2(yAxis, xAxis);
      normalizedXAxis = Math.cos(theta);
      normalizedYAxis = Math.sin(theta);
    }

    // Scale and move the circle so values are in the interpolation range.  The circle's origin moves
    // from (0, 0) to (0.5, 0.5). The circle's radius scales from 1 to be 0.5.
    normalizedXAxis = normalizedXAxis * 0.5 + 0.5;
    normalizedYAxis = normalizedYAxis * 0.5 + 0.5;

    if (componentProperty === XRInputComponentProperty.XAxis) {
      return validState ? normalizedXAxis : 0.5;
    } else {
      return validState ? normalizedYAxis : 0.5;
    }
  } else if (componentProperty === XRInputComponentProperty.Button) {
    return validState ? button : 0;
  } else if (componentProperty === XRInputComponentProperty.State) {
    return validState ? 1.0 : 0.0;
  } else {
    return 0;
  }
}

const BUTTON_TOUCH_THRESHOLD = 0.05;
const AXIS_TOUCH_THRESHOLD = 0.1;

export function updateComponentValuesFromGamepad(
  { gamepadIndices }: XRInputComponent,
  gamepad: Gamepad,
  component: InputComponentState
): void {
  let state = XRInputComponentStateValue.Default;

  if (gamepadIndices.button !== undefined && gamepad.buttons.length > gamepadIndices.button) {
    const gamepadButton = gamepad.buttons[gamepadIndices.button];
    const button = clamp(0, 1, gamepadButton.value);

    if (gamepadButton.pressed || button === 1) {
      state = XRInputComponentStateValue.Pressed;
    } else if (gamepadButton.touched || button > BUTTON_TOUCH_THRESHOLD) {
      state = XRInputComponentStateValue.Touched;
    }

    component.button = button;
  } else {
    component.button = 0;
  }

  if (gamepadIndices.xAxis !== undefined && gamepad.axes.length > gamepadIndices.xAxis) {
    const gamepadAxis = gamepad.axes[gamepadIndices.xAxis];
    const xAxis = clamp(-1, 1, gamepadAxis);

    if (state === XRInputComponentStateValue.Default && Math.abs(xAxis) > AXIS_TOUCH_THRESHOLD) {
      state = XRInputComponentStateValue.Touched;
    }

    component.xAxis = xAxis;
  } else {
    component.xAxis = 0;
  }

  if (gamepadIndices.yAxis !== undefined && gamepad.axes.length > gamepadIndices.yAxis) {
    // NOTE: The Gamepad API defines the forward direction as negative on the yAxis so we negate here.
    // https://w3c.github.io/gamepad/#dom-gamepad-axes
    const gamepadAxis = -gamepad.axes[gamepadIndices.yAxis];
    const yAxis = clamp(-1, 1, gamepadAxis);

    if (state === XRInputComponentStateValue.Default && Math.abs(yAxis) > AXIS_TOUCH_THRESHOLD) {
      state = XRInputComponentStateValue.Touched;
    }

    component.yAxis = yAxis;
  } else {
    component.yAxis = 0;
  }

  component.state = state;
}
