import { ResourceDefinition } from "./ResourceDefinition";

export const MAX_C_STRING_BYTE_LENGTH = 1024;

export interface IResourceManager {
  buffer: ArrayBuffer | SharedArrayBuffer;
  U8Heap: Uint8Array;
  U32Heap: Uint32Array;
  textDecoder: TextDecoder;
  textEncoder: TextEncoder;
  allocate(byteLength: number): number;
  allocateString(value: string): number;
  deallocate(ptr: number): void;
  decodeString(ptr: number): string;
  encodeString(ptr: number, value: string): number;

  createResource(resourceDef: ResourceDefinition): number;
  getString(resourceId: number, byteOffset: number): string;
  setString(resourceId: number, byteOffset: number, value: string): void;
  getU32(resourceId: number, byteOffset: number): number;
  setU32(resourceId: number, byteOffset: number, value: number): void;
}

export function calculateResourceSize(resourceDef: ResourceDefinition): number {
  let byteLength = 0;

  for (const key in resourceDef.schema) {
    const prop = resourceDef.schema[key];
    byteLength += prop.byteLength;
  }

  return byteLength;
}
