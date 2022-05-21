import { RenderThreadState } from "../RenderWorker";

export interface RenderThreadModule<ModuleState> {
  create(): ModuleState;
  init: (state: RenderThreadState) => Promise<void>;
  dispose?: (state: RenderThreadState) => void;
}
