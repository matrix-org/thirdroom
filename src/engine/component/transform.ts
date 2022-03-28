import { CursorBuffer, addView, addViewAoA } from '../allocator/CursorBuffer'

export interface TransformComponent {
  position: Float32Array[];
  rotation: Float32Array[];
  quaternion: Float32Array[];
  scale: Float32Array[];

  localMatrix: Float32Array[];
  worldMatrix: Float32Array[];
  matrixAutoUpdate: Uint8Array;
  worldMatrixNeedsUpdate: Uint8Array;

  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
}

export const addViewVector3 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 3, n)
export const addViewVector4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 4, n)
export const addViewMatrix4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 16, n)

export const createTransform = (gameBuffer: CursorBuffer, renderBuffer: CursorBuffer, size: number): TransformComponent => ({
  position: addViewVector3(renderBuffer, size),
  scale: addViewVector3(renderBuffer, size),
  rotation: addViewVector3(renderBuffer, size),
  quaternion: addViewVector4(renderBuffer, size),

  localMatrix: addViewMatrix4(renderBuffer, size),
  worldMatrix: addViewMatrix4(renderBuffer, size),
  matrixAutoUpdate: addView(renderBuffer, Uint8Array, size),
  worldMatrixNeedsUpdate: addView(renderBuffer, Uint8Array, size),

  parent: addView(gameBuffer, Uint32Array, size),
  firstChild: addView(gameBuffer, Uint32Array, size),
  prevSibling: addView(gameBuffer, Uint32Array, size),
  nextSibling: addView(gameBuffer, Uint32Array, size),
});