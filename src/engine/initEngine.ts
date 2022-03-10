import { EventEmitter } from "events";

export enum EngineState {
  Uninitialized,
  Initialized,
  Loaded,
  Entered
}

export class Engine extends EventEmitter {
  public state: EngineState = EngineState.Uninitialized;

  constructor(private canvas: HTMLCanvasElement) {
    super();
  }

  private updateState(nextState: EngineState) {
    this.state = nextState;
    this.emit("state-changed", this.state);
  }

  async init() {
    this.updateState(EngineState.Initialized);
  }

  async loadWorld() {
    this.updateState(EngineState.Loaded);
  }

  enterWorld() {
    this.updateState(EngineState.Entered);
  }

  exitWorld() {
    this.updateState(EngineState.Loaded);
  }

  unloadWorld() {
    this.updateState(EngineState.Initialized);
  }

  dispose() {
    this.updateState(EngineState.Uninitialized);
  }
}

export function initEngine(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas);
  engine.init();
  return engine;
}