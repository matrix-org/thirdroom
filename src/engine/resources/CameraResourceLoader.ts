import { PerspectiveCamera, OrthographicCamera, Camera } from "three";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";
import { GameState } from "../GameWorker";

const CAMERA_RESOURCE = "camera";

export enum CameraType {
  Perspective = "perspective",
  Orthographic = "orthographic",
}

export interface ICameraDefinition extends ResourceDefinition {
  type: "camera";
  cameraType: CameraType;
}

export interface PerspectiveCameraDefinition extends ICameraDefinition {
  cameraType: CameraType.Perspective;
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
}

export interface OrthographicCameraDefinition extends ICameraDefinition {
  cameraType: CameraType.Orthographic;
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
}

export type CameraDefinition = PerspectiveCameraDefinition | OrthographicCameraDefinition;

export function CameraResourceLoader(manager: ResourceManager): ResourceLoader<CameraDefinition, Camera> {
  return {
    type: CAMERA_RESOURCE,
    async load(def) {
      let camera: Camera;

      switch (def.cameraType) {
        case CameraType.Perspective:
          camera = new PerspectiveCamera(def.yfov, def.aspectRatio || 1, def.znear, def.zfar || 1000);
          break;
        case CameraType.Orthographic:
          camera = new OrthographicCamera(-def.xmag, def.xmag, def.ymag, -def.ymag, def.znear, def.zfar);
          break;
        default:
          throw new Error(`Unknown camera type ${(def as unknown as any).cameraType}`);
      }

      camera.name = def.name!;

      return {
        name: def.name,
        resource: camera,
      };
    },
  };
}

export function CameraRemoteResourceLoader(state: GameState): RemoteResourceLoader {
  return {
    type: CAMERA_RESOURCE,
  };
}

export function createRemoteCamera(manager: RemoteResourceManager, cameraDef: CameraDefinition): number {
  return loadRemoteResource(manager, cameraDef);
}
