import { MainThreadState } from "../MainThread";

export interface MainThreadModule<ModuleState> {
  create(): ModuleState;
  init: (state: MainThreadState) => Promise<void>;
  dispose?: (state: MainThreadState) => void;
}
