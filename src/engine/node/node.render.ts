import { Camera, Light, Line, LineLoop, LineSegments, Mesh, Points, SkinnedMesh } from "three";

import { LocalCameraResource } from "../camera/camera.render";
import { LocalLightResource } from "../light/light.render";
import { LocalMesh } from "../mesh/mesh.render";
import { RendererSharedNode } from "./node.common";

type PrimitiveObject3D = Mesh | SkinnedMesh | Line | LineSegments | LineLoop | Points;

export interface LocalNode {
  rendererSharedNode: RendererSharedNode;
  mesh?: LocalMesh;
  meshPrimitiveObjects?: PrimitiveObject3D[];
  camera?: LocalCameraResource;
  cameraObject?: Camera;
  light?: LocalLightResource;
  lightObject?: Light;
}
