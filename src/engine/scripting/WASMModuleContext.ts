import {
  CursorView,
  moveCursorView,
  readFloat32Array,
  readUint32,
  rewindCursorView,
  skipUint32,
} from "../allocator/CursorView";
import { GameContext, RemoteResourceManager } from "../GameTypes";
import { IRemoteResourceClass, RemoteResourceConstructor } from "../resource/RemoteResourceClass";
import { getRemoteResources } from "../resource/resource.game";
import { toSharedArrayBuffer } from "../utils/arraybuffer";

export interface WASMModuleContext {
  memory: WebAssembly.Memory;
  U8Heap: Uint8Array;
  U32Heap: Uint32Array;
  I32Heap: Int32Array;
  F32Heap: Float32Array;
  textEncoder: TextEncoder;
  textDecoder: TextDecoder;
  cursorView: CursorView;
  encodedJSSource?: Uint8Array;
  resourceManager: RemoteResourceManager;
}

export function writeString(wasmCtx: WASMModuleContext, ptr: number, value: string, maxBufLength?: number) {
  const arr = wasmCtx.textEncoder.encode(value);

  if (maxBufLength !== undefined && arr.byteLength > maxBufLength) {
    throw new Error("Exceeded maximum byte length");
  }

  return writeEncodedString(wasmCtx, ptr, arr);
}

export function writeEncodedString(wasmCtx: WASMModuleContext, ptr: number, arr: Uint8Array) {
  const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
  nullTerminatedArr.set(arr);
  wasmCtx.U8Heap.set(nullTerminatedArr, ptr);
  // Don't include null character in byte length
  return arr.byteLength;
}

export function readString(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  if (!ptr) {
    return "";
  }

  const maxPtr = ptr + byteLength;
  let end = ptr;

  // Find the end of the null-terminated C string on the heap
  while (!(end >= maxPtr) && wasmCtx.U8Heap[end]) {
    ++end;
  }

  // create a new subarray to store the string so that this always works with SharedArrayBuffer
  return wasmCtx.textDecoder.decode(wasmCtx.U8Heap.slice(ptr, end));
}

export function readStringFromCursorView(wasmCtx: WASMModuleContext, maxByteLength = 255) {
  const ptr = readUint32(wasmCtx.cursorView);

  if (!ptr) {
    return "";
  }

  const maxPtr = ptr + maxByteLength;
  let end = ptr;

  // Find the end of the null-terminated C string on the heap
  while (!(end >= maxPtr) && wasmCtx.U8Heap[end]) {
    ++end;
  }

  // create a new subarray to store the string so that this always works with SharedArrayBuffer
  return wasmCtx.textDecoder.decode(wasmCtx.U8Heap.slice(ptr, end));
}

export function readJSON(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  const jsonString = readString(wasmCtx, ptr, byteLength);
  return JSON.parse(jsonString);
}

export function writeUint8Array(wasmCtx: WASMModuleContext, ptr: number, array: Uint8Array) {
  wasmCtx.U8Heap.set(array, ptr);
  return array.byteLength;
}

export function readUint8Array(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.U8Heap.subarray(ptr, ptr + byteLength);
}

export function writeUint32Array(wasmCtx: WASMModuleContext, ptr: number, array: Uint32Array) {
  wasmCtx.U32Heap.set(array, ptr / 4);
  return array.byteLength;
}

export function writeInt32Array(wasmCtx: WASMModuleContext, ptr: number, array: Int32Array) {
  wasmCtx.I32Heap.set(array, ptr / 4);
  return array.byteLength;
}

export function readUint32Array(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.U32Heap.subarray(ptr / 4, (ptr + byteLength) / 4);
}

export function readInt32ArrayInto(wasmCtx: WASMModuleContext, ptr: number, target: Int32Array) {
  const I32Heap = wasmCtx.I32Heap;
  const offset = ptr / 4;

  for (let i = 0; i < target.length; i++) {
    target[i] = I32Heap[offset + i];
  }

  return target;
}

export function writeFloat32Array(wasmCtx: WASMModuleContext, ptr: number, array: Float32Array) {
  wasmCtx.F32Heap.set(array, ptr / 4);
  return array.byteLength;
}

// export function readFloat32Array(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
//   return wasmCtx.F32Heap.subarray(ptr / 4, (ptr + byteLength) / 4);
// }

export function readFloat32ArrayInto(wasmCtx: WASMModuleContext, ptr: number, target: Float32Array) {
  const F32Heap = wasmCtx.F32Heap;
  const offset = ptr / 4;

  for (let i = 0; i < target.length; i++) {
    target[i] = F32Heap[offset + i];
  }

  return target;
}

export function writeArrayBuffer(wasmCtx: WASMModuleContext, ptr: number, array: ArrayBuffer) {
  return writeUint8Array(wasmCtx, ptr, new Uint8Array(array));
}

export function readArrayBuffer(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.memory.buffer.slice(ptr, ptr + byteLength);
}

export function readSharedArrayBuffer(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return toSharedArrayBuffer(wasmCtx.memory.buffer, ptr, byteLength);
}

export function writeNumberArray(wasmCtx: WASMModuleContext, ptr: number, array: ArrayLike<number>) {
  const offset = ptr / 4;

  for (let i = 0; i < array.length; i++) {
    wasmCtx.U32Heap[offset + i] = array[i];
  }

  return array.length;
}

export function getScriptResource<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  resourceId: number
): InstanceType<T> | undefined {
  const { resourceIds, resourceMap } = wasmCtx.resourceManager;
  const { name, resourceType } = resourceConstructor.resourceDef;

  if (!resourceIds.has(resourceId)) {
    console.error(`WebSG: missing or unpermitted use of ${name}: ${resourceId}`);
    return undefined;
  }

  const resource = resourceMap.get(resourceId) as InstanceType<T> | undefined;

  if (!resource) {
    console.error(`WebSG: missing ${name}: ${resourceId}`);
    return undefined;
  }

  if (resource.resourceType !== resourceType) {
    console.error(`WebSG: id does not point to a ${name}: ${resourceId}`);
    return undefined;
  }

  return resource;
}

export function getScriptResourceByName<T extends RemoteResourceConstructor>(
  ctx: GameContext,
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  name: string
): InstanceType<T> | undefined {
  const resources = getRemoteResources(ctx, resourceConstructor as IRemoteResourceClass<T["resourceDef"]>);

  const resourceIds = wasmCtx.resourceManager.resourceIds;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];

    if (resource.name === name && resourceIds.has(resource.eid)) {
      return resource as InstanceType<T>;
    }
  }

  return undefined;
}

export function getScriptResourceByNamePtr<T extends RemoteResourceConstructor>(
  ctx: GameContext,
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  namePtr: number,
  byteLength: number
): InstanceType<T> | undefined {
  const name = readString(wasmCtx, namePtr, byteLength);
  return getScriptResourceByName(ctx, wasmCtx, resourceConstructor, name);
}

export function getScriptResourceRef<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  refResource: InstanceType<T> | undefined
): number {
  if (!refResource) {
    return 0;
  }

  const resourceId = refResource.eid;

  if (!wasmCtx.resourceManager.resourceIds.has(resourceId)) {
    console.error(`WebSG: missing or unpermitted use of ${resourceConstructor.name}: ${resourceId}`);
    return 0;
  }

  return resourceId;
}

export function readFloatList(wasmCtx: WASMModuleContext): Float32Array | undefined {
  const itemsPtr = readUint32(wasmCtx.cursorView);
  const count = readUint32(wasmCtx.cursorView);

  if (count === 0) {
    return undefined;
  }

  const rewind = rewindCursorView(wasmCtx.cursorView);
  moveCursorView(wasmCtx.cursorView, itemsPtr);
  const arr = readFloat32Array(wasmCtx.cursorView, count);
  rewind();
  return arr;
}

export function readStringLen(wasmCtx: WASMModuleContext): string {
  const strPtr = readUint32(wasmCtx.cursorView);
  const byteLength = readUint32(wasmCtx.cursorView);
  const rewind = rewindCursorView(wasmCtx.cursorView);
  const value = readString(wasmCtx, strPtr, byteLength);
  rewind();
  return value;
}

export function readList<T>(
  wasmCtx: WASMModuleContext,
  readItem: (wasmCtx: WASMModuleContext, index: number) => T
): T[] {
  const items: T[] = [];

  const itemsPtr = readUint32(wasmCtx.cursorView);
  const count = readUint32(wasmCtx.cursorView);
  const rewind = rewindCursorView(wasmCtx.cursorView);
  moveCursorView(wasmCtx.cursorView, itemsPtr);

  for (let i = 0; i < count; i++) {
    items.push(readItem(wasmCtx, i));
  }

  rewind();

  return items;
}

export function readEnum<T extends {}>(wasmCtx: WASMModuleContext, enumType: T, enumName: string): number {
  const enumValue = readUint32(wasmCtx.cursorView);

  if (enumValue in enumType) {
    return enumValue;
  }

  throw new Error(`WebSG: ${enumValue} is not a valid ${enumName} `);
}

export function readResourceRef<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T
): InstanceType<T> | undefined {
  const resourceId = readUint32(wasmCtx.cursorView);
  return resourceId ? getScriptResource(wasmCtx, resourceConstructor, resourceId) : undefined;
}

export function readRefMap<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  keyEnum: any,
  keyEnumName: string,
  resourceConstructor: T
): { [key: string]: InstanceType<T> } {
  const map: { [key: number]: InstanceType<T> } = {};

  const itemsPtr = readUint32(wasmCtx.cursorView);
  const count = readUint32(wasmCtx.cursorView);
  const rewind = rewindCursorView(wasmCtx.cursorView);
  moveCursorView(wasmCtx.cursorView, itemsPtr);

  for (let i = 0; i < count; i++) {
    const key = readEnum(wasmCtx, keyEnum, keyEnumName);
    const value = readResourceRef(wasmCtx, resourceConstructor);

    if (!value) {
      throw new Error(`Failed to read resource ref for key ${key}`);
    }

    map[key] = value;
  }

  rewind();

  return map;
}

export function readExtensionsAndExtras<T extends { [key: string]: unknown }>(
  wasmCtx: WASMModuleContext,
  parseExtension: (name: string) => T | undefined = () => undefined
) {
  const itemsPtr = readUint32(wasmCtx.cursorView);
  const count = readUint32(wasmCtx.cursorView);
  // TODO: Implement glTF extras in WebSG API
  skipUint32(wasmCtx.cursorView); // Skip extras pointer

  const extensions = {};

  if (count > 0) {
    const rewind = rewindCursorView(wasmCtx.cursorView);

    moveCursorView(wasmCtx.cursorView, itemsPtr);

    for (let i = 0; i < count; i++) {
      const name = readStringFromCursorView(wasmCtx);
      const extensionPtr = readUint32(wasmCtx.cursorView);
      const itemRewind = rewindCursorView(wasmCtx.cursorView);
      moveCursorView(wasmCtx.cursorView, extensionPtr);
      Object.assign(extensions, parseExtension(name));
      itemRewind();
    }

    rewind();
  }

  return extensions as Partial<T>;
}
