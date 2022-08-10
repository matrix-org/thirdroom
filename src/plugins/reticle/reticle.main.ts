import { IMainThreadContext } from "../../engine/MainThread";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { ReticleFocusMessage, ReticleFocusMessageType } from "./reticle.common";

interface ReticleModuleState {
  reticleElement: HTMLElement;
  parentElement: HTMLElement;
}

const reticleCss = `
  position: absolute;
  top: 50vh;
  left: 50vw;
  background: white;
  width: 6px;
  height: 6px;
  border-radius: 10px;
  border-style: solid;
  border-width: 1px;
  margin-top: -3px;
  margin-left: -3px;
  z-index: 999;
  transition: all 0.05s linear;
`;

const reticleFocusedCss = `
  ${reticleCss}
  width: 8px;
  height: 8px;
  margin-top: -4px;
  margin-left: -4px;
  background: cornflowerblue;
`;

export const ReticleModule = defineModule<IMainThreadContext, ReticleModuleState>({
  name: "reticle",
  create() {
    const reticleElement = document.createElement("div");
    reticleElement.setAttribute("style", reticleCss);

    const parentElement = document.querySelector(".SessionView") as HTMLCanvasElement;

    return {
      reticleElement,
      parentElement,
    };
  },
  init(ctx) {
    const reticle = getModule(ctx, ReticleModule);

    const onReticleFocus = (ctx: IMainThreadContext, message: ReticleFocusMessageType) => {
      if (message.focused) {
        reticle.reticleElement.setAttribute("style", reticleFocusedCss);
      } else {
        reticle.reticleElement.setAttribute("style", reticleCss);
      }
    };

    return registerMessageHandler(ctx, ReticleFocusMessage, onReticleFocus);
  },
});

export const showReticle = (ctx: IMainThreadContext) => {
  const { parentElement, reticleElement } = getModule(ctx, ReticleModule);
  parentElement.appendChild(reticleElement);
};

export const hideReticle = (ctx: IMainThreadContext) => {
  const { parentElement, reticleElement } = getModule(ctx, ReticleModule);
  parentElement.removeChild(reticleElement);
};
