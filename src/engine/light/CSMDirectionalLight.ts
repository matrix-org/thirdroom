import { vec3 } from "gl-matrix";
import {
  Box3,
  DirectionalLight,
  Material,
  MathUtils,
  Matrix4,
  Object3D,
  PerspectiveCamera,
  Vector2,
  Vector3,
} from "three";

import CSMFrustum from "./CSMFrustum";
import { CSMHelper } from "./CSMHelper";

const DEBUG = false;

export const NUM_CSM_CASCADES = 1;
const SHADOW_NEAR = 1;
const SHADOW_FAR = 200;
export const MAX_SHADOW_DISTANCE = 100;
const SHADOW_MAP_SIZE = 2048;
const SHADOW_BIAS = 0;
const LIGHT_MARGIN = 50;

const logarithmicSplits: number[] = [];
const uniformSplits: number[] = [];
const cameraToLightMatrix = new Matrix4();
const lightSpaceFrustum = new CSMFrustum();
const center = new Vector3();
const bbox = new Box3();

export class CSMDirectionalLight extends Object3D {
  private color: vec3 = [1, 1, 1];
  private intensity = 1;
  private _castShadow = false;
  private camera?: PerspectiveCamera;
  private splits: number[] = [];
  private helper?: CSMHelper;

  public readonly lights: DirectionalLight[] = [];
  public readonly mainFrustum: CSMFrustum;
  public readonly frustums: CSMFrustum[] = [];

  public direction: Vector3 = new Vector3(1, -1, 1).normalize();

  public isCSMDirectionalLight = true;

  constructor(color?: vec3, intensity?: number) {
    super();

    if (color) {
      this.color = color;
    }

    if (intensity !== undefined) {
      this.intensity = intensity;
    }

    this.mainFrustum = new CSMFrustum();

    for (let i = 0; i < NUM_CSM_CASCADES; i++) {
      const light = new DirectionalLight();
      light.color.fromArray(this.color);
      light.intensity = this.intensity;
      light.castShadow = this._castShadow;
      light.shadow.mapSize.setScalar(SHADOW_MAP_SIZE);
      light.shadow.camera.near = SHADOW_NEAR;
      light.shadow.camera.far = SHADOW_FAR;
      this.add(light);
      this.add(light.target);
      this.lights.push(light);
    }

    if (DEBUG) {
      const helper = new CSMHelper();
      this.helper = helper;
      this.add(helper);
    }
  }

  public getColor(): vec3 {
    return this.color;
  }

  public setColor(color: vec3) {
    vec3.copy(this.color, color);

    for (let i = 0; i < this.lights.length; i++) {
      this.lights[i].color.fromArray(color);
    }
  }

  public getIntensity(): number {
    return this.intensity;
  }

  public setIntensity(intensity: number) {
    this.intensity = intensity;

    for (let i = 0; i < this.lights.length; i++) {
      this.lights[i].intensity = intensity;
    }
  }

  public getCastShadow(): boolean {
    return this._castShadow;
  }

  public setCastShadow(castShadow: boolean) {
    this._castShadow = true;

    for (let i = 0; i < this.lights.length; i++) {
      this.lights[i].castShadow = castShadow;
    }
  }

  private updateFrustums(camera: PerspectiveCamera) {
    const far = Math.min(camera.far, MAX_SHADOW_DISTANCE);

    logarithmicSplits.length = 0;
    uniformSplits.length = 0;
    this.splits.length = 0;

    for (let i = 1; i < NUM_CSM_CASCADES; i++) {
      logarithmicSplits.push((camera.near * (far / camera.near) ** (i / NUM_CSM_CASCADES)) / far);
      uniformSplits.push((camera.near + ((far - camera.near) * i) / NUM_CSM_CASCADES) / far);
    }

    logarithmicSplits.push(1);
    uniformSplits.push(1);

    for (let i = 1; i < NUM_CSM_CASCADES; i++) {
      this.splits.push(MathUtils.lerp(uniformSplits[i - 1], logarithmicSplits[i - 1], 0.5));
    }

    this.splits.push(1);

    camera.updateProjectionMatrix();

    this.mainFrustum.setFromProjectionMatrix(camera.projectionMatrix, MAX_SHADOW_DISTANCE);
    this.mainFrustum.split(this.splits, this.frustums);

    for (let i = 0; i < this.frustums.length; i++) {
      const light = this.lights[i];
      const shadowCamera = light.shadow.camera;
      const frustum = this.frustums[i];

      // Get the two points that represent that furthest points on the frustum assuming
      // that's either the diagonal across the far plane or the diagonal across the whole
      // frustum itself.
      const nearVerts = frustum.vertices.near;
      const farVerts = frustum.vertices.far;
      const point1 = farVerts[0];
      let point2;
      if (point1.distanceTo(farVerts[2]) > point1.distanceTo(nearVerts[2])) {
        point2 = farVerts[2];
      } else {
        point2 = nearVerts[2];
      }

      let squaredBBWidth = point1.distanceTo(point2);

      // expand the shadow extents by the fade margin
      // TODO: shouldn't this be Math.min?
      const far = Math.max(camera.far, MAX_SHADOW_DISTANCE);
      const linearDepth = frustum.vertices.far[0].z / (far - camera.near);
      const margin = 0.25 * Math.pow(linearDepth, 2.0) * (far - camera.near);

      squaredBBWidth += margin;

      shadowCamera.left = -squaredBBWidth / 2;
      shadowCamera.right = squaredBBWidth / 2;
      shadowCamera.top = squaredBBWidth / 2;
      shadowCamera.bottom = -squaredBBWidth / 2;
      shadowCamera.updateProjectionMatrix();

      light.shadow.bias = SHADOW_BIAS * squaredBBWidth;
    }
  }

  public updateMaterial(camera: PerspectiveCamera, material: Material) {
    for (let i = 0; i < NUM_CSM_CASCADES; i++) {
      const splitRange = material.userData.csmSplits.value[i] as Vector2;
      const amount = this.splits[i];
      const prev = this.splits[i - 1] || 0;
      splitRange.x = prev;
      splitRange.y = amount;
    }

    const far = Math.min(camera.far, MAX_SHADOW_DISTANCE);

    material.userData.cameraNear.value = camera.near;
    material.userData.shadowFar.value = far;
  }

  public update(camera: PerspectiveCamera) {
    if (camera !== this.camera) {
      this.camera = camera;
      this.updateFrustums(camera);
    }

    const frustums = this.frustums;

    for (let i = 0; i < frustums.length; i++) {
      const light = this.lights[i];
      const shadowCam = light.shadow.camera;
      const texelWidth = (shadowCam.right - shadowCam.left) / SHADOW_MAP_SIZE;
      const texelHeight = (shadowCam.top - shadowCam.bottom) / SHADOW_MAP_SIZE;
      light.shadow.camera.updateMatrixWorld(true);
      cameraToLightMatrix.multiplyMatrices(light.shadow.camera.matrixWorldInverse, camera.matrixWorld);
      frustums[i].toSpace(cameraToLightMatrix, lightSpaceFrustum);

      const nearVerts = lightSpaceFrustum.vertices.near;
      const farVerts = lightSpaceFrustum.vertices.far;
      bbox.makeEmpty();

      for (let j = 0; j < 4; j++) {
        bbox.expandByPoint(nearVerts[j]);
        bbox.expandByPoint(farVerts[j]);
      }

      bbox.getCenter(center);
      center.z = bbox.max.z + LIGHT_MARGIN;
      center.x = Math.floor(center.x / texelWidth) * texelWidth;
      center.y = Math.floor(center.y / texelHeight) * texelHeight;
      center.applyMatrix4(light.shadow.camera.matrixWorld);

      light.position.copy(center);
      light.target.position.copy(center);

      light.target.position.x += this.direction.x;
      light.target.position.y += this.direction.y;
      light.target.position.z += this.direction.z;
    }

    if (this.helper) {
      this.helper.update(this, camera);
    }
  }
}
