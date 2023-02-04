import { TilesRenderer } from "3d-tiles-renderer";
import {
  Bone,
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  FrontSide,
  InstancedMesh,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Light,
  LineBasicMaterial,
  MaterialParameters,
  Matrix4,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PointsMaterial,
  Skeleton,
  SkinnedMesh,
  Texture,
} from "three";

import {
  AccessorComponentTypeToTypedArray,
  AccessorTypeToElementSize,
  getAccessorArrayView,
} from "../accessor/accessor.common";
import {
  getDefaultMaterialForMeshPrimitive,
  isPhysicalMaterial,
  matchMaterial,
  MaterialCacheEntry,
  patchMaterial,
  PrimitiveMaterial,
} from "../material/material.render";
import { PrimitiveObject3D, MeshPrimitiveAttributeToThreeAttribute } from "../mesh/mesh.render";
import { getModule } from "../module/module.common";
import { ReflectionProbe } from "../reflection-probe/ReflectionProbe";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { removeUndefinedProperties } from "../utils/removeUndefinedProperties";
import { RenderImageData, RenderImageDataType } from "../utils/textures";
import { toTrianglesDrawMode } from "../utils/toTrianglesDrawMode";
import { defineLocalResourceClass } from "./LocalResourceClass";
import { createLocalResourceModule, LoadStatus } from "./resource.common";
import {
  SamplerResource,
  LightResource,
  CameraResource,
  BufferResource,
  BufferViewResource,
  InteractableResource,
  SparseAccessorResource,
  TilesRendererResource,
  NametagResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
  ResourceType,
  AccessorResource,
  ImageResource,
  InstancedMeshResource,
  LightMapResource,
  MaterialAlphaMode,
  MaterialResource,
  MaterialType,
  MeshPrimitiveMode,
  MeshPrimitiveResource,
  MeshResource,
  NodeResource,
  ReflectionProbeResource,
  SceneResource,
  SkinResource,
  TextureResource,
  MeshPrimitiveAttributeIndex,
  AnimationSamplerResource,
  AnimationChannelResource,
  AnimationResource,
  WorldResource,
  EnvironmentResource,
} from "./schema";

export class RenderNametag extends defineLocalResourceClass(NametagResource) {}

export class RenderSampler extends defineLocalResourceClass(SamplerResource) {}

export class RenderBuffer extends defineLocalResourceClass(BufferResource) {}

export class RenderBufferView extends defineLocalResourceClass(BufferViewResource) {
  declare buffer: RenderBuffer;
}

export class RenderAudioData extends defineLocalResourceClass(AudioDataResource) {
  declare bufferView: RenderBufferView | undefined;
}

export class RenderAudioSource extends defineLocalResourceClass(AudioSourceResource) {
  declare audio: RenderAudioData | undefined;
}

export class RenderAudioEmitter extends defineLocalResourceClass(AudioEmitterResource) {
  declare sources: RenderAudioSource[];
}

export class RenderImage extends defineLocalResourceClass(ImageResource) {
  declare bufferView: RenderBufferView | undefined;

  imageData?: RenderImageData;
  loadStatus: LoadStatus = LoadStatus.Uninitialized;
  abortController?: AbortController;

  dispose() {
    this.loadStatus = LoadStatus.Disposed;

    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.imageData && this.imageData.type === RenderImageDataType.ImageBitmap) {
      this.imageData.data.close();
    }
  }
}

export class RenderTexture extends defineLocalResourceClass(TextureResource) {
  declare sampler: RenderSampler | undefined;
  declare source: RenderImage;

  texture?: Texture;
  loadStatus: LoadStatus = LoadStatus.Uninitialized;
  abortController?: AbortController;

  dispose() {
    this.loadStatus = LoadStatus.Disposed;

    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.texture) {
      this.texture.dispose();
    }
  }
}

export class RenderReflectionProbe extends defineLocalResourceClass(ReflectionProbeResource) {
  declare reflectionProbeTexture: RenderTexture | undefined;
  textureArrayIndex = 0;
}

export class RenderMaterial extends defineLocalResourceClass(MaterialResource) {
  declare baseColorTexture: RenderTexture | undefined;
  declare metallicRoughnessTexture: RenderTexture | undefined;
  declare normalTexture: RenderTexture | undefined;
  declare occlusionTexture: RenderTexture | undefined;
  declare emissiveTexture: RenderTexture | undefined;
  declare transmissionTexture: RenderTexture | undefined;
  declare thicknessTexture: RenderTexture | undefined;

  materialCache: MaterialCacheEntry[] = [];

  getMaterialForMeshPrimitive(ctx: RenderThreadState, meshPrimitive: RenderMeshPrimitive): PrimitiveMaterial {
    const rendererModule = getModule(ctx, RendererModule);
    const mode = meshPrimitive.mode;
    const vertexColors = !!meshPrimitive.attributes[MeshPrimitiveAttributeIndex.COLOR_0];
    const flatShading = !meshPrimitive.attributes[MeshPrimitiveAttributeIndex.NORMAL];
    const useDerivativeTangents = !meshPrimitive.attributes[MeshPrimitiveAttributeIndex.TANGENT];

    const cacheEntry = this.materialCache.find(matchMaterial(mode, vertexColors, flatShading, useDerivativeTangents));

    if (cacheEntry) {
      if (meshPrimitive.materialObj !== cacheEntry.material) {
        cacheEntry.refCount++;
      }

      return cacheEntry.material;
    }

    let material: PrimitiveMaterial;

    const baseParameters: MaterialParameters = {
      opacity: this.baseColorFactor[3],
      side: this.doubleSided ? DoubleSide : FrontSide,
      transparent: this.alphaMode === MaterialAlphaMode.BLEND,
      depthWrite: this.alphaMode !== MaterialAlphaMode.BLEND,
      alphaTest:
        this.alphaMode === MaterialAlphaMode.MASK
          ? this.alphaCutoff !== undefined
            ? this.alphaCutoff
            : 0.5
          : undefined,
      vertexColors,
    };

    const color = new Color().fromArray(this.baseColorFactor);

    if (this.type === MaterialType.Unlit) {
      if (
        mode === MeshPrimitiveMode.TRIANGLES ||
        mode === MeshPrimitiveMode.TRIANGLE_FAN ||
        mode === MeshPrimitiveMode.TRIANGLE_STRIP
      ) {
        material = new MeshBasicMaterial(
          removeUndefinedProperties({
            ...baseParameters,
            color,
            map: this.baseColorTexture?.texture,
            toneMapped: false,
          })
        );

        const map = material.map;
        if (map) {
          map.offset.fromArray(this.baseColorTextureOffset);
          map.rotation = this.baseColorTextureRotation;
          map.repeat.fromArray(this.baseColorTextureScale);
          rendererModule.renderer.initTexture(map);
        }
      } else if (
        mode === MeshPrimitiveMode.LINES ||
        mode === MeshPrimitiveMode.LINE_STRIP ||
        mode === MeshPrimitiveMode.LINE_LOOP
      ) {
        material = new LineBasicMaterial(removeUndefinedProperties({ ...baseParameters, color, toneMapped: false }));
      } else if (mode === MeshPrimitiveMode.POINTS) {
        material = new PointsMaterial(
          removeUndefinedProperties({
            ...baseParameters,
            map: this.baseColorTexture?.texture,
            sizeAttenuation: false,
            toneMapped: false,
          })
        );

        const map = material.map;
        if (map) {
          map.offset.fromArray(this.baseColorTextureOffset);
          map.rotation = this.baseColorTextureRotation;
          map.repeat.fromArray(this.baseColorTextureScale);
          rendererModule.renderer.initTexture(map);
        }
      } else {
        throw new Error(`Unsupported mesh mode ${mode}`);
      }
    } else if (this.type === MaterialType.Standard) {
      if (
        mode === MeshPrimitiveMode.TRIANGLES ||
        mode === MeshPrimitiveMode.TRIANGLE_FAN ||
        mode === MeshPrimitiveMode.TRIANGLE_STRIP
      ) {
        if (isPhysicalMaterial(this)) {
          const physicalMaterial = new MeshPhysicalMaterial(
            removeUndefinedProperties({
              ...baseParameters,
              color,
              map: this.baseColorTexture?.texture,
              metalnessMap: this.metallicRoughnessTexture?.texture,
              roughnessMap: this.metallicRoughnessTexture?.texture,
              aoMap: this.occlusionTexture?.texture,
              emissiveMap: this.emissiveTexture?.texture,
              normalMap: this.normalTexture?.texture,
              metalness: this.metallicFactor, // 🤘
              roughness: this.roughnessFactor,
              aoMapIntensity: this.occlusionTextureStrength,
              emissive: new Color().fromArray(this.emissiveFactor),
              emissiveIntensity: this.emissiveStrength,
              flatShading,
              ior: this.ior,
              thickness: this.thicknessFactor as any, // TODO: Add thickness to MeshStandardMaterialParameters types
              thicknessMap: this.thicknessTexture?.texture,
              attenuationDistance: this.attenuationDistance,
              attenuationColor: new Color().fromArray(this.attenuationColor),
              transmission: this.transmissionFactor,
              transmissionMap: this.transmissionTexture?.texture,
            })
          );

          console.log("physical material", physicalMaterial);

          const map = physicalMaterial.map;
          if (map) {
            map.offset.fromArray(this.baseColorTextureOffset);
            map.rotation = this.baseColorTextureRotation;
            map.repeat.fromArray(this.baseColorTextureScale);
            rendererModule.renderer.initTexture(map);
          }

          const metalnessMap = physicalMaterial.metalnessMap;
          if (metalnessMap) {
            metalnessMap.offset.fromArray(this.metallicRoughnessTextureOffset);
            metalnessMap.rotation = this.metallicRoughnessTextureRotation;
            metalnessMap.repeat.fromArray(this.metallicRoughnessTextureScale);
            rendererModule.renderer.initTexture(metalnessMap);
          }

          const aoMap = physicalMaterial.aoMap;
          if (aoMap) {
            aoMap.offset.fromArray(this.occlusionTextureOffset);
            aoMap.rotation = this.occlusionTextureRotation;
            aoMap.repeat.fromArray(this.occlusionTextureScale);
            rendererModule.renderer.initTexture(aoMap);
          }

          const emissiveMap = physicalMaterial.emissiveMap;
          if (emissiveMap) {
            emissiveMap.offset.fromArray(this.emissiveTextureOffset);
            emissiveMap.rotation = this.emissiveTextureRotation;
            emissiveMap.repeat.fromArray(this.emissiveTextureScale);
            rendererModule.renderer.initTexture(emissiveMap);
          }

          const normalMap = physicalMaterial.normalMap;
          if (normalMap) {
            normalMap.offset.fromArray(this.normalTextureOffset);
            normalMap.rotation = this.normalTextureRotation;
            normalMap.repeat.fromArray(this.normalTextureScale);
            rendererModule.renderer.initTexture(normalMap);
          }

          physicalMaterial.normalScale.set(
            this.normalScale,
            useDerivativeTangents ? -this.normalScale : this.normalScale
          );

          const thicknessMap = physicalMaterial.thicknessMap;
          if (thicknessMap) {
            thicknessMap.offset.fromArray(this.thicknessTextureOffset);
            thicknessMap.rotation = this.thicknessTextureRotation;
            thicknessMap.repeat.fromArray(this.thicknessTextureScale);
            rendererModule.renderer.initTexture(thicknessMap);
          }

          const transmissionMap = physicalMaterial.transmissionMap;
          if (transmissionMap) {
            transmissionMap.offset.fromArray(this.transmissionTextureOffset);
            transmissionMap.rotation = this.transmissionTextureRotation;
            transmissionMap.repeat.fromArray(this.transmissionTextureScale);
            rendererModule.renderer.initTexture(transmissionMap);
          }

          material = physicalMaterial;
        } else {
          material = new MeshStandardMaterial(
            removeUndefinedProperties({
              ...baseParameters,
              color,
              map: this.baseColorTexture?.texture,
              metalnessMap: this.metallicRoughnessTexture?.texture,
              roughnessMap: this.metallicRoughnessTexture?.texture,
              aoMap: this.occlusionTexture?.texture,
              emissiveMap: this.emissiveTexture?.texture,
              normalMap: this.normalTexture?.texture,
              metalness: this.metallicFactor, // 🤘
              roughness: this.roughnessFactor,
              aoMapIntensity: this.occlusionTextureStrength,
              emissive: new Color().fromArray(this.emissiveFactor),
              emissiveIntensity: this.emissiveStrength,
              flatShading,
            })
          );

          const map = material.map;
          if (map) {
            map.offset.fromArray(this.baseColorTextureOffset);
            map.rotation = this.baseColorTextureRotation;
            map.repeat.fromArray(this.baseColorTextureScale);
            rendererModule.renderer.initTexture(map);
          }

          const metalnessMap = material.metalnessMap;
          if (metalnessMap) {
            metalnessMap.offset.fromArray(this.metallicRoughnessTextureOffset);
            metalnessMap.rotation = this.metallicRoughnessTextureRotation;
            metalnessMap.repeat.fromArray(this.metallicRoughnessTextureScale);
            rendererModule.renderer.initTexture(metalnessMap);
          }

          const aoMap = material.aoMap;
          if (aoMap) {
            aoMap.offset.fromArray(this.occlusionTextureOffset);
            aoMap.rotation = this.occlusionTextureRotation;
            aoMap.repeat.fromArray(this.occlusionTextureScale);
            rendererModule.renderer.initTexture(aoMap);
          }

          const emissiveMap = material.emissiveMap;
          if (emissiveMap) {
            emissiveMap.offset.fromArray(this.emissiveTextureOffset);
            emissiveMap.rotation = this.emissiveTextureRotation;
            emissiveMap.repeat.fromArray(this.emissiveTextureScale);
            rendererModule.renderer.initTexture(emissiveMap);
          }

          const normalMap = material.normalMap;
          if (normalMap) {
            normalMap.offset.fromArray(this.normalTextureOffset);
            normalMap.rotation = this.normalTextureRotation;
            normalMap.repeat.fromArray(this.normalTextureScale);
            rendererModule.renderer.initTexture(normalMap);
          }

          material.normalScale.set(this.normalScale, useDerivativeTangents ? -this.normalScale : this.normalScale);
        }

        patchMaterial(ctx, material);
      } else if (
        mode === MeshPrimitiveMode.LINES ||
        mode === MeshPrimitiveMode.LINE_STRIP ||
        mode === MeshPrimitiveMode.LINE_LOOP
      ) {
        material = new LineBasicMaterial(removeUndefinedProperties({ ...baseParameters, color }));
      } else if (mode === MeshPrimitiveMode.POINTS) {
        material = new PointsMaterial(
          removeUndefinedProperties({
            ...baseParameters,
            color,
            map: this.baseColorTexture?.texture,
            sizeAttenuation: false,
          })
        );

        const map = material.map;
        if (map) {
          map.offset.fromArray(this.baseColorTextureOffset);
          map.rotation = this.baseColorTextureRotation;
          map.repeat.fromArray(this.baseColorTextureScale);
          rendererModule.renderer.initTexture(map);
        }
      } else {
        throw new Error(`Unsupported mesh mode ${mode}`);
      }
    } else {
      throw new Error(`Unsupported material type ${this.type}`);
    }

    material.name = this.name;

    this.materialCache.push({
      material,
      flatShading,
      vertexColors,
      mode,
      useDerivativeTangents,
      refCount: 1,
    });

    return material;
  }

  disposeMeshPrimitiveMaterial(material: PrimitiveMaterial) {
    const index = this.materialCache.findIndex((entry) => entry.material === material);

    if (index === -1) {
      return;
    }

    const cacheEntry = this.materialCache[index];

    cacheEntry.refCount--;

    if (cacheEntry.refCount <= 0) {
      material.dispose();
      this.materialCache.splice(index, 1);
    }
  }

  dispose(ctx: RenderThreadState): void {
    for (const entry of this.materialCache) {
      entry.material.dispose();
    }
  }
}

export class RenderLight extends defineLocalResourceClass(LightResource) {}

export class RenderCamera extends defineLocalResourceClass(CameraResource) {}

export class RenderSparseAccessor extends defineLocalResourceClass(SparseAccessorResource) {
  declare indicesBufferView: RenderBufferView;
  declare valuesBufferView: RenderBufferView;
}

const defaultAttribute = new BufferAttribute(new Float32Array(0), 0);

export class RenderAccessor extends defineLocalResourceClass(AccessorResource) {
  declare bufferView: RenderBufferView | undefined;
  declare sparse: RenderSparseAccessor | undefined;

  attribute: BufferAttribute | InterleavedBufferAttribute = defaultAttribute;
  prevVersion = 0;

  load(ctx: RenderThreadState) {
    const elementSize = AccessorTypeToElementSize[this.type];
    const arrConstructor = AccessorComponentTypeToTypedArray[this.componentType];
    const componentByteLength = arrConstructor.BYTES_PER_ELEMENT;
    const elementByteLength = componentByteLength * elementSize;

    if (this.bufferView && this.bufferView.byteStride && this.bufferView.byteStride !== elementByteLength) {
      const arrayView = getAccessorArrayView(this, false);
      const interleavedBuffer = new InterleavedBuffer(
        arrayView,
        this.bufferView.byteStride / arrayView.BYTES_PER_ELEMENT
      );
      this.attribute = new InterleavedBufferAttribute(interleavedBuffer, elementSize, 0, this.normalized);
    } else {
      this.attribute = new BufferAttribute(getAccessorArrayView(this), elementSize, this.normalized);

      if (this.dynamic) {
        this.attribute.setUsage(DynamicDrawUsage);
      }
    }

    this.prevVersion = this.version;

    if (this.dynamic) {
      const { dynamicAccessors } = getModule(ctx, RendererModule);
      dynamicAccessors.push(this);
    }
  }

  dispose(ctx: RenderThreadState): void {
    const { dynamicAccessors } = getModule(ctx, RendererModule);

    const index = dynamicAccessors.indexOf(this);

    if (index !== -1) {
      dynamicAccessors.splice(index, 1);
    }
  }
}

export class RenderInstancedMesh extends defineLocalResourceClass(InstancedMeshResource) {
  declare attributes: RenderAccessor[];
}

export class RenderMesh extends defineLocalResourceClass(MeshResource) {
  declare primitives: RenderMeshPrimitive[];
}

const defaultGeometry = new BufferGeometry();
const defaultMaterial = new MeshStandardMaterial();

export class RenderMeshPrimitive extends defineLocalResourceClass(MeshPrimitiveResource) {
  declare attributes: RenderAccessor[];
  declare indices: RenderAccessor | undefined;
  declare material: RenderMaterial | undefined;

  geometryObj: BufferGeometry = defaultGeometry;
  materialObj: PrimitiveMaterial = defaultMaterial;
  autoUpdateNormals = false;

  load(ctx: RenderThreadState) {
    let geometryObj = new BufferGeometry();

    if (this.indices) {
      if ("isInterleavedBufferAttribute" in this.indices.attribute) {
        throw new Error("Interleaved attributes are not supported as mesh indices.");
      }

      geometryObj.setIndex(this.indices.attribute);
    }

    for (let i = 0; i < this.attributes.length; i++) {
      const accessor = this.attributes[i];

      if (accessor) {
        geometryObj.setAttribute(MeshPrimitiveAttributeToThreeAttribute[i], accessor.attribute);
      }
    }

    if (this.mode === MeshPrimitiveMode.TRIANGLE_STRIP) {
      geometryObj = toTrianglesDrawMode(geometryObj, MeshPrimitiveMode.TRIANGLE_STRIP);
    } else if (this.mode === MeshPrimitiveMode.TRIANGLE_FAN) {
      geometryObj = toTrianglesDrawMode(geometryObj, MeshPrimitiveMode.TRIANGLE_FAN);
    }

    this.geometryObj = geometryObj;

    if (!this.material) {
      this.materialObj = getDefaultMaterialForMeshPrimitive(ctx, this);
    } else {
      this.materialObj = this.material.getMaterialForMeshPrimitive(ctx, this);
    }

    if (this.attributes[MeshPrimitiveAttributeIndex.POSITION]?.dynamic) {
      this.autoUpdateNormals = true;
    }
  }

  dispose() {
    this.geometryObj.dispose();

    if (this.material) {
      this.material.disposeMeshPrimitiveMaterial(this.materialObj);
    }
  }
}

export class RenderLightMap extends defineLocalResourceClass(LightMapResource) {
  declare texture: RenderTexture;
}

export class RenderTilesRenderer extends defineLocalResourceClass(TilesRendererResource) {}

export class RenderSkin extends defineLocalResourceClass(SkinResource) {
  declare joints: RenderNode[];
  declare inverseBindMatrices: RenderAccessor | undefined;
  skeleton?: Skeleton;
}

export class RenderInteractable extends defineLocalResourceClass(InteractableResource) {}

export class RenderNode extends defineLocalResourceClass(NodeResource) {
  declare parentScene: RenderScene | undefined;
  declare parent: RenderNode | undefined;
  declare firstChild: RenderNode | undefined;
  declare prevSibling: RenderNode | undefined;
  declare nextSibling: RenderNode | undefined;
  declare mesh: RenderMesh | undefined;
  declare instancedMesh: RenderInstancedMesh | undefined;
  declare lightMap: RenderLightMap | undefined;
  declare skin: RenderSkin | undefined;
  declare light: RenderLight | undefined;
  declare reflectionProbe: RenderReflectionProbe | undefined;
  declare camera: RenderCamera | undefined;
  declare audioEmitter: RenderAudioEmitter | undefined;
  declare tilesRenderer: RenderTilesRenderer | undefined;
  declare nametag: RenderNametag | undefined;
  declare interactable: RenderInteractable | undefined;

  currentMeshResourceId = 0;
  bone?: Bone;
  meshPrimitiveObjects?: PrimitiveObject3D[];
  currentCameraResourceId = 0;
  cameraObject?: PerspectiveCamera | OrthographicCamera;
  currentLightResourceId = 0;
  lightObject: Light | undefined;
  tilesRendererObject?: TilesRenderer;
  tilesRendererCamera?: Camera;
  currentTilesRendererResourceId = 0;
  currentReflectionProbeResourceId = 0;
  reflectionProbeObject?: ReflectionProbe;
  object3DVisible = true;
  needsUpdate = true;
  object3DWorldMatrix = new Matrix4();

  dispose(ctx: RenderThreadState) {
    if (this.meshPrimitiveObjects) {
      for (let i = 0; i < this.meshPrimitiveObjects.length; i++) {
        const primitive = this.meshPrimitiveObjects[i];
        primitive.parent?.remove(primitive);

        if (primitive instanceof SkinnedMesh) {
          for (let j = 0; j < primitive.skeleton.bones.length; j++) {
            const bone = primitive.skeleton.bones[j];
            bone.parent?.remove(bone);
          }
          primitive.skeleton.dispose();
        }

        if (primitive instanceof InstancedMesh) {
          primitive.geometry.dispose();
        }
      }
    }

    if (this.cameraObject) {
      this.cameraObject.parent?.remove(this.cameraObject);
    }

    if (this.lightObject) {
      this.lightObject.parent?.remove(this.lightObject);
    }

    if (this.reflectionProbeObject) {
      this.reflectionProbeObject.parent?.remove(this.reflectionProbeObject);
    }

    if (this.tilesRendererObject) {
      const { tileRendererNodes } = getModule(ctx, RendererModule);

      const obj = this.tilesRendererObject.group;
      obj.parent?.remove(obj);
      this.tilesRendererObject.dispose();

      const index = tileRendererNodes.indexOf(this);

      if (index !== -1) {
        tileRendererNodes.splice(index, 1);
      }
    }
  }
}

export class RenderAnimationSampler extends defineLocalResourceClass(AnimationSamplerResource) {
  declare input: RenderAccessor;
  declare output: RenderAccessor;
}

export class RenderAnimationChannel extends defineLocalResourceClass(AnimationChannelResource) {
  declare sampler: RenderAnimationSampler;
  declare targetNode: RenderNode;
}

export class RenderAnimation extends defineLocalResourceClass(AnimationResource) {
  declare channels: RenderAnimationChannel[];
  declare samplers: RenderAnimationSampler[];
}

export class RenderScene extends defineLocalResourceClass(SceneResource) {
  declare resourceType: ResourceType.Scene;
  declare backgroundTexture: RenderTexture | undefined;
  declare reflectionProbe: RenderReflectionProbe | undefined;
  declare audioEmitters: RenderAudioEmitter[];
  declare firstNode: RenderNode | undefined;
  currentBackgroundTextureResourceId = 0;
  currentReflectionProbeResourceId = 0;
  reflectionProbeNeedsUpdate = false;
}

export class RenderEnvironment extends defineLocalResourceClass(EnvironmentResource) {
  declare publicScene: RenderScene;
  declare privateScene: RenderScene;
}

export class RenderWorld extends defineLocalResourceClass(WorldResource) {
  declare environment: RenderEnvironment | undefined;
  declare firstNode: RenderNode | undefined;
  declare persistentScene: RenderScene;
  declare activeCameraNode: RenderNode | undefined;
  declare activeAvatarNode: RenderNode | undefined;
  declare activeLeftControllerNode: RenderNode | undefined;
  declare activeRightControllerNode: RenderNode | undefined;
}

const {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  registerResource,
  registerResourceLoader,
  ResourceLoaderSystem,
  ReturnRecycledResourcesSystem,
} = createLocalResourceModule<RenderThreadState>([
  RenderNode,
  RenderAudioData,
  RenderAudioSource,
  RenderAudioEmitter,
  RenderNametag,
  RenderLight,
  RenderSampler,
  RenderCamera,
  RenderBuffer,
  RenderBufferView,
  RenderImage,
  RenderMaterial,
  RenderTexture,
  RenderMesh,
  RenderScene,
  RenderMeshPrimitive,
  RenderInteractable,
  RenderAccessor,
  RenderSparseAccessor,
  RenderSkin,
  RenderInstancedMesh,
  RenderLightMap,
  RenderReflectionProbe,
  RenderTilesRenderer,
  RenderAnimation,
  RenderAnimationChannel,
  RenderAnimationSampler,
  RenderEnvironment,
  RenderWorld,
]);

export {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  registerResource,
  registerResourceLoader,
  ResourceLoaderSystem,
  ReturnRecycledResourcesSystem,
};
