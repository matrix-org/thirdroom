import RAPIER from "@dimforge/rapier3d-compat";

import { RemoteResourceInfo, RemoteResourceManager } from "../../src/engine/resources/RemoteResourceManager";
import { PostMessageTarget } from "../../src/engine/WorkerMessage";
import { createTripleBuffer } from "../../src/engine/TripleBuffer";

export const mockPostMessageTarget = () =>
  ({
    postMessage: (message: any, transfer?: Array<Transferable | OffscreenCanvas>) => {},
    addEventListener: (
      type: string,
      callback: ((message: any) => void) | null,
      options?: AddEventListenerOptions | boolean
    ) => {},
    removeEventListener: (
      type: string,
      callback: ((message: any) => void) | null,
      options?: EventListenerOptions | boolean
    ) => {},
  } as PostMessageTarget);

export const mockRemoteResourceManager = (buffer = new SharedArrayBuffer(4)) =>
  ({
    buffer,
    view: new Uint32Array(buffer),
    postMessageTarget: mockPostMessageTarget(),
    store: new Map<number, RemoteResourceInfo<any>>(),
  } as RemoteResourceManager);

export const mockPhysicsWorld = () => ({
  createRigidBody: (body: RAPIER.RigidBodyDesc) => ({
    handle: 0,
    lockTranslations: () => {},
    lockRotations: () => {},
  }),
  createCollider: (desc: RAPIER.ColliderDesc, parentHandle?: number | undefined) => {},
});

export const mockRenderer = () => ({
  tripleBuffer: createTripleBuffer(),
  port: mockPostMessageTarget(),
});
