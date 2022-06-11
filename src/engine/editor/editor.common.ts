import { addViewByComponentPropertyType, createCursorBuffer } from "../allocator/CursorBuffer";
import { TypedArray } from "../allocator/types";
import { ComponentInfo } from "../component/types";
import { maxEntities } from "../config.common";
import { TripleBuffer } from "../allocator/TripleBuffer";
import { ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { hierarchyObjectBufferSchema } from "../component/transform.common";

export interface Selection {
  activeEntity?: number;
  activeEntityComponents?: number[];
  selectedEntities: number[];
}

export enum EditorEventType {
  EditorLoaded = "editor-loaded",
  SelectionChanged = "selection-changed",
  ComponentInfoChanged = "component-info-changed",
  ComponentPropertyChanged = "component-property-changed",
}

export interface ActiveEntityView {
  [propertyId: number]: TypedArray | TypedArray[] | undefined;
}

export function createActiveEntityViews(
  activeEntityTripleBuffer: TripleBuffer,
  activeEntityComponents: number[],
  componentInfoMap: Map<number, ComponentInfo>
): ActiveEntityView[] {
  return activeEntityTripleBuffer.buffers.map((sharedArrayBuffer) => {
    const cursorBuffer = createCursorBuffer(sharedArrayBuffer);
    const activeEntityView: ActiveEntityView = {};

    for (const componentId of activeEntityComponents) {
      const componentInfo = componentInfoMap.get(componentId);

      if (componentInfo) {
        for (const property of componentInfo.props) {
          activeEntityView[property.id] = addViewByComponentPropertyType(cursorBuffer, property.type, maxEntities);
        }
      }
    }
    return activeEntityView;
  });
}

export type HierarchyTripleBuffer = ObjectTripleBuffer<typeof hierarchyObjectBufferSchema>;

export enum EditorMessageType {
  InitializeEditorState = "InitializeEditorState",
}

export interface InitializeEditorStateMessage {
  hierarchyTripleBuffer: HierarchyTripleBuffer;
}

export const editorModuleName = "editor";
