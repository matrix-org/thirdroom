import { RenderWorkerState } from "../RenderWorker";
import { SelectionChangedMessage, WorkerMessageType } from "../WorkerMessage";

export interface EditorRendererState {
  editorLoaded: boolean;
  selectedEntities: number[];
  prevSelectedEntities: number[];
}

export function initEditorRendererState(): EditorRendererState {
  return {
    editorLoaded: false,
    selectedEntities: [],
    prevSelectedEntities: [],
  };
}

export function initEditorRenderer(state: RenderWorkerState) {
  state.messageHandlers[WorkerMessageType.LoadEditor] = onLoadEditor;
  state.messageHandlers[WorkerMessageType.DisposeEditor] = onDisposeEditor;
  state.messageHandlers[WorkerMessageType.SelectionChanged] = onSelectionChanged;
  //state.preSystems.push(EditorRendererSystem);
}

function onLoadEditor(state: RenderWorkerState) {
  state.editor.editorLoaded = true;
}

function onDisposeEditor(state: RenderWorkerState) {
  state.editor.editorLoaded = false;
  state.editor.selectedEntities.length = 0;
}

function onSelectionChanged(state: RenderWorkerState, message: SelectionChangedMessage) {
  state.editor.selectedEntities = message.selection.entities;
}

// function EditorRendererSystem(state: RenderWorkerState) {
//   const { editorLoaded, helpersNeedUpdate, selectedEntities, prevSelectedEntities } = state.editor;

//   if (helpersNeedUpdate) {
//     if (editorLoaded) {
//       for (let i = 0; i < state.renderables; i++) {
//         if () {

//         }
//       }
//     } else {

//     }

//     state.editor.helpersNeedUpdate = false;
//   }

//   if (!editorLoaded) {
//     return;
//   }
// }

// const helperMaterial = new MeshBasicMaterial({ color: 0xffff00, wireframe: true, depthTest: false });

// function createHelper(renderable: Renderable): Object3D | undefined {
//   if (!renderable.object) {
//     return undefined;
//   }

//   if (renderable.object.type === "Mesh") {
//     const mesh = renderable.object as Mesh;
//     return new Mesh(mesh.geometry, helperMaterial);
//   }

//   return undefined;
// }
