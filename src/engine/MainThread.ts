import GameWorker from "./GameWorker?worker";
import { createInputManager } from "./input/InputManager";
import { createResourceManagerBuffer } from "./resources/ResourceManager";
import { createStatsBuffer, getStats, StatsObject } from "./stats";
import { createTripleBuffer } from "./TripleBuffer";
import {
  GameWorkerInitializedMessage,
  RenderWorkerInitializedMessage,
  WorkerMessages,
  WorkerMessageType,
  PostMessageTarget,
} from "./WorkerMessage";

export async function initRenderWorker(canvas: HTMLCanvasElement, gameWorker: Worker) {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;

  let renderWorker: Worker;
  let canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  let renderWorkerMessageTarget: PostMessageTarget;
  let gameWorkerMessageTarget: PostMessageTarget;

  if (supportsOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    renderWorker = new RenderWorker();
    canvasTarget = canvas.transferControlToOffscreen();
    const interWorkerChannel = new MessageChannel();
    renderWorkerMessageTarget = interWorkerChannel.port1;
    gameWorkerMessageTarget = interWorkerChannel.port2;
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const result = await import("./RenderWorker");
    renderWorker = result.default as Worker;
    renderWorkerMessageTarget = result.default;
    gameWorkerMessageTarget = gameWorker;
    canvasTarget = canvas;
  }

  function onResize() {
    renderWorker.postMessage({
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return {
    renderWorker,
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose() {
      window.removeEventListener("resize", onResize);

      if (renderWorker instanceof Worker) {
        renderWorker.terminate();
      }
    },
  };
}

export interface Selection {
  entities: number[];
  components: number[];
}

export interface ComponentPropertyInfo {
  id: number;
  name: string;
  type: EditorPropType;
}

export enum EditorPropType {
  Vec3 = "vec3",
}

export interface EditorPropTypeToDataType {
  [EditorPropType.Vec3]: number[];
}

export interface ComponentInfo {
  name: string;
  props: ComponentPropertyInfo[];
}

export enum EditorEventType {
  EditorLoaded = "editor-loaded",
  SelectionChanged = "selection-changed",
  ComponentInfoChanged = "component-info-changed",
  ComponentPropertyChanged = "component-property-changed",
}

export interface Engine {
  startTestNet(): void;
  setHost(value: boolean): void;
  setState(state: any): void;
  setPeerId(peerId: string): void;
  hasPeer(peerId: string): boolean;
  addPeer(peerId: string, dataChannel: RTCDataChannel): void;
  removePeer(peerId: string): void;
  disconnect(): void;
  getStats(): StatsObject;
  exportScene(): void;
  loadEditor(): void;
  disposeEditor(): void;
  getSelection(): Selection;
  getComponentInfo(componentId: number): ComponentInfo | undefined;
  removeComponent(componentId: number): void;
  getComponentProperty<T extends EditorPropType>(propertyId: number): EditorPropTypeToDataType[T] | undefined;
  setComponentProperty<T>(propertyId: number, value: T): void;
  addListener(type: EditorEventType.SelectionChanged, listener: (selection: Selection) => void): void;
  addListener(
    type: EditorEventType.ComponentInfoChanged,
    listener: (componentId: number, componentInfo: ComponentInfo) => void
  ): void;
  addListener<T extends EditorPropType>(
    type: EditorEventType.ComponentPropertyChanged,
    listener: (propertyId: number, value: EditorPropTypeToDataType[T]) => void
  ): void;
  addListener(type: EditorEventType, listener: (...args: any[]) => void): void;
  removeListener(type: EditorEventType, listener: (...args: any[]) => void): void;
  dispose(): void;
}

interface EditorState {
  selection: Selection;
  componentInfoMap: Map<number, ComponentInfo>;
  componentProperties: Map<number, any>;
  eventListeners: Map<string, ((...args: any[]) => void)[]>;
}

export async function initEngine(canvas: HTMLCanvasElement): Promise<Engine> {
  const inputManager = createInputManager(canvas);
  const gameWorker = new GameWorker();
  const {
    renderWorker,
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose: disposeRenderWorker,
  } = await initRenderWorker(canvas, gameWorker);

  const renderableTripleBuffer = createTripleBuffer();

  const resourceManagerBuffer = createResourceManagerBuffer();

  const renderWorkerMessagePort =
    renderWorkerMessageTarget instanceof MessagePort ? renderWorkerMessageTarget : undefined;

  const statsBuffer = createStatsBuffer();

  /* Wait for workers to be ready */

  await new Promise<RenderWorkerInitializedMessage>((resolve, reject) => {
    renderWorker.postMessage(
      {
        type: WorkerMessageType.InitializeRenderWorker,
        renderableTripleBuffer,
        gameWorkerMessageTarget,
        canvasTarget,
        initialCanvasWidth: canvas.clientWidth,
        initialCanvasHeight: canvas.clientHeight,
        resourceManagerBuffer,
        statsSharedArrayBuffer: statsBuffer.buffer,
      },
      gameWorkerMessageTarget instanceof MessagePort && canvasTarget instanceof OffscreenCanvas
        ? [gameWorkerMessageTarget, canvasTarget]
        : undefined
    );

    const onMessage = ({ data }: any): void => {
      if (data.type === WorkerMessageType.RenderWorkerInitialized) {
        resolve(data);
        renderWorker.removeEventListener("message", onMessage);
      } else if (data.type === WorkerMessageType.RenderWorkerError) {
        reject(data.error);
        renderWorker.removeEventListener("message", onMessage);
      }
    };

    renderWorker.addEventListener("message", onMessage);
  });

  await new Promise<GameWorkerInitializedMessage>((resolve, reject) => {
    gameWorker.postMessage(
      {
        type: WorkerMessageType.InitializeGameWorker,
        renderableTripleBuffer,
        inputTripleBuffer: inputManager.tripleBuffer,
        renderWorkerMessagePort,
        resourceManagerBuffer,
        statsSharedArrayBuffer: statsBuffer.buffer,
      },
      renderWorkerMessagePort ? [renderWorkerMessagePort] : undefined
    );

    const onMessage = ({ data }: { data: WorkerMessages }): void => {
      if (data.type === WorkerMessageType.GameWorkerInitialized) {
        resolve(data);
        gameWorker.removeEventListener("message", onMessage);
      } else if (data.type === WorkerMessageType.GameWorkerError) {
        reject(data.error);
        gameWorker.removeEventListener("message", onMessage);
      }
    };

    gameWorker.addEventListener("message", onMessage);
  });

  /* Start Workers */

  renderWorker.postMessage({
    type: WorkerMessageType.StartRenderWorker,
  });

  gameWorker.postMessage({
    type: WorkerMessageType.StartGameWorker,
  });

  /* Render Worker Messages */

  const onRenderWorkerMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.SaveGLTF:
        downloadFile(message.buffer, "scene.glb");
        break;
    }
  };

  renderWorker.addEventListener("message", onRenderWorkerMessage);

  /* Game Worker Messages */

  const onPeerMessage = ({ data }: { data: ArrayBuffer }) => {
    gameWorker.postMessage({ type: WorkerMessageType.ReliableNetworkMessage, packet: data }, [data]);
  };

  let ws: WebSocket | undefined;

  const reliableChannels: Map<string, RTCDataChannel> = new Map();
  const unreliableChannels: Map<string, RTCDataChannel> = new Map();

  const sendReliable = (peerId: string, packet: ArrayBuffer) => {
    if (ws) {
      ws.send(packet);
    } else {
      const peer = reliableChannels.get(peerId);
      if (peer) peer.send(packet);
    }
  };

  const sendUnreliable = (peerId: string, packet: ArrayBuffer) => {
    if (ws) {
      ws.send(packet);
    } else {
      const peer = unreliableChannels.get(peerId);
      if (peer) peer.send(packet);
    }
  };

  const broadcastReliable = (packet: ArrayBuffer) => {
    if (ws) {
      ws.send(packet);
    } else {
      reliableChannels.forEach((peer) => {
        if (peer.readyState === "open") {
          peer.send(packet);
        }
      });
    }
  };

  const broadcastUnreliable = (packet: ArrayBuffer) => {
    if (ws) {
      ws?.send(packet);
    } else {
      unreliableChannels.forEach((peer) => {
        if (peer.readyState === "open") {
          peer.send(packet);
        }
      });
    }
  };

  /* Editor Messages */

  const editorState: EditorState = {
    selection: { entities: [], components: [] },
    componentInfoMap: new Map(),
    componentProperties: new Map(),
    eventListeners: new Map(),
  };

  function emitEditorEvent(type: EditorEventType, ...args: any[]) {
    const listeners = editorState.eventListeners.get(type);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(...args);
    }
  }

  function onEditorLoaded(componentInfos: [number, ComponentInfo][]) {
    editorState.componentInfoMap = new Map(componentInfos);
    emitEditorEvent(EditorEventType.EditorLoaded);
  }

  function onSelectionChanged(selection: Selection, initialValues: Map<number, any>) {
    editorState.selection = selection;
    editorState.componentProperties = initialValues;
    emitEditorEvent(EditorEventType.SelectionChanged, selection);
  }

  function onComponentInfoChanged(componentId: number, componentInfo: ComponentInfo) {
    editorState.componentInfoMap.set(componentId, componentInfo);
    emitEditorEvent(EditorEventType.ComponentInfoChanged, componentId, componentInfo);
  }

  function onComponentPropertyChanged(propertyId: number, value: any) {
    editorState.componentProperties.set(propertyId, value);
    emitEditorEvent(EditorEventType.ComponentPropertyChanged, propertyId, value);
  }

  const onGameWorkerMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.ReliableNetworkMessage:
        sendReliable(message.peerId, message.packet);
        break;
      case WorkerMessageType.UnreliableNetworkMessage:
        sendUnreliable(message.peerId, message.packet);
        break;
      case WorkerMessageType.ReliableNetworkBroadcast:
        broadcastReliable(message.packet);
        break;
      case WorkerMessageType.UnreliableNetworkBroadcast:
        broadcastUnreliable(message.packet);
        break;
      case WorkerMessageType.EditorLoaded:
        onEditorLoaded(message.componentInfos);
        break;
      case WorkerMessageType.SelectionChanged:
        onSelectionChanged(message.selection, message.initialValues);
        break;
      case WorkerMessageType.ComponentInfoChanged:
        onComponentInfoChanged(message.componentId, message.componentInfo);
        break;
      case WorkerMessageType.ComponentPropertyChanged:
        onComponentPropertyChanged(message.propertyId, message.value);
        break;
    }
  };

  gameWorker.addEventListener("message", onGameWorkerMessage);

  /* Update loop for input manager */

  let animationFrameId: number;

  function update() {
    inputManager.update();

    animationFrameId = requestAnimationFrame(update);
  }

  update();

  function onPeerLeft(peerId: string) {
    const reliableChannel = reliableChannels.get(peerId);
    const unreliableChannel = reliableChannels.get(peerId);
    reliableChannel?.removeEventListener("message", onPeerMessage);
    unreliableChannel?.removeEventListener("message", onPeerMessage);

    reliableChannels.delete(peerId);
    unreliableChannels.delete(peerId);

    gameWorker.postMessage({
      type: WorkerMessageType.RemovePeerId,
      peerId,
    });
  }

  return {
    startTestNet() {
      ws = new WebSocket("ws://localhost:9090");
      ws.binaryType = "arraybuffer";

      ws.addEventListener("open", (data) => {
        console.log("connected to websocket server");
      });

      ws.addEventListener("close", (data) => {});

      const setHostFn = (data: { data: any }) => {
        if (data.data === "setHost") {
          console.log("ws - setHost");
          gameWorker.postMessage({
            type: WorkerMessageType.SetHost,
            value: true,
          });
          ws?.removeEventListener("message", setHostFn);
        }
      };
      ws.addEventListener("message", setHostFn);

      const setPeerIdFn = (data: { data: any }) => {
        try {
          const d: any = JSON.parse(data.data);
          if (d.setPeerId) {
            console.log("ws - setPeerId", d.setPeerId);
            gameWorker.postMessage({
              type: WorkerMessageType.SetPeerId,
              peerId: d.setPeerId,
            });
            gameWorker.postMessage({
              type: WorkerMessageType.StateChanged,
              state: { joined: true },
            });

            ws?.addEventListener("message", onPeerMessage);

            ws?.removeEventListener("message", setPeerIdFn);
          }
        } catch {}
      };
      ws.addEventListener("message", setPeerIdFn);

      const addPeerId = (data: { data: any }) => {
        try {
          const d: any = JSON.parse(data.data);
          if (d.addPeerId) {
            console.log("ws - addPeerId", d.addPeerId);
            gameWorker.postMessage({
              type: WorkerMessageType.AddPeerId,
              peerId: d.addPeerId,
            });
          }
        } catch {}
      };
      ws.addEventListener("message", addPeerId);
    },
    setHost(value: boolean) {
      gameWorker.postMessage({
        type: WorkerMessageType.SetHost,
        value,
      });
    },
    setState(state: any) {
      gameWorker.postMessage({
        type: WorkerMessageType.StateChanged,
        state,
      });
    },
    hasPeer(peerId: string): boolean {
      return reliableChannels.has(peerId);
    },
    addPeer(peerId: string, dataChannel: RTCDataChannel) {
      if (dataChannel.ordered) reliableChannels.set(peerId, dataChannel);
      else unreliableChannels.set(peerId, dataChannel);

      const onOpen = () => {
        const onClose = () => {
          onPeerLeft(peerId);
        };

        dataChannel.addEventListener("message", onPeerMessage);
        dataChannel.addEventListener("close", onClose);

        gameWorker.postMessage({
          type: WorkerMessageType.AddPeerId,
          peerId,
        });
      };

      dataChannel.binaryType = "arraybuffer";
      dataChannel.addEventListener("open", onOpen);
    },
    removePeer(peerId: string) {
      onPeerLeft(peerId);
    },
    disconnect() {
      for (const [peerId] of reliableChannels) {
        onPeerLeft(peerId);
      }
    },
    setPeerId(peerId: string) {
      gameWorker.postMessage({
        type: WorkerMessageType.SetPeerId,
        peerId,
      });
    },
    loadEditor() {
      gameWorker.postMessage({
        type: WorkerMessageType.LoadEditor,
      });
    },
    disposeEditor() {
      editorState.selection = { entities: [], components: [] };
      editorState.componentInfoMap.clear();
      editorState.componentProperties.clear();
      gameWorker.postMessage({
        type: WorkerMessageType.DisposeEditor,
      });
    },
    getSelection(): Selection {
      return editorState.selection;
    },
    getComponentInfo(componentId: number): ComponentInfo | undefined {
      return editorState.componentInfoMap.get(componentId);
    },
    removeComponent(componentId: number): void {
      gameWorker.postMessage({
        type: WorkerMessageType.RemoveComponent,
        entities: editorState.selection.entities,
        componentId,
      });
    },
    getComponentProperty<T extends EditorPropType>(propertyId: number): EditorPropTypeToDataType[T] | undefined {
      return editorState.componentProperties.get(propertyId);
    },
    setComponentProperty<T>(propertyId: number, value: T): void {
      gameWorker.postMessage({
        type: WorkerMessageType.SetComponentProperty,
        entities: editorState.selection.entities,
        propertyId,
        value,
      });
    },
    addListener(type: EditorEventType, listener: (...args: any[]) => void): void {
      const listeners = editorState.eventListeners.get(type) || [];
      listeners.push(listener);
      editorState.eventListeners.set(type, listeners);
    },
    removeListener(type: EditorEventType, listener: (...args: any[]) => void): void {
      const listeners = editorState.eventListeners.get(type);

      if (listeners) {
        const index = listeners.indexOf(listener);

        if (index === -1) {
          return;
        }

        listeners.splice(index, 1);

        if (listeners.length === 0) {
          editorState.eventListeners.delete(type);
        }
      }
    },
    getStats() {
      return getStats(statsBuffer);
    },
    exportScene() {
      gameWorker.postMessage({
        type: WorkerMessageType.ExportScene,
      });
    },
    dispose() {
      cancelAnimationFrame(animationFrameId);
      inputManager.dispose();
      gameWorker.terminate();
      disposeRenderWorker();
    },
  };
}

function downloadFile(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const el = document.createElement("a");
  el.style.display = "none";
  document.body.appendChild(el);
  el.href = URL.createObjectURL(blob);
  el.download = fileName;
  el.click();
  document.body.removeChild(el);
}
