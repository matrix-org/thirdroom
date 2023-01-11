import { TilesRenderer } from "3d-tiles-renderer";
import {
  Bone,
  BufferAttribute,
  BufferGeometry,
  Camera,
  ClampToEdgeWrapping,
  Color,
  CompressedTexture,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeUVReflectionMapping,
  DoubleSide,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  FrontSide,
  InstancedMesh,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Light,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  LineBasicMaterial,
  Mapping,
  MaterialParameters,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PointsMaterial,
  RepeatWrapping,
  Skeleton,
  SkinnedMesh,
  Texture,
  TextureEncoding as ThreeTextureEncoding,
  TextureFilter,
  UVMapping,
  Wrapping,
} from "three";
import { RGBE } from "three/examples/jsm/loaders/RGBELoader";

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
import { BaseThreadContext, getModule } from "../module/module.common";
import { ReflectionProbe } from "../reflection-probe/ReflectionProbe";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { toArrayBuffer } from "../utils/arraybuffer";
import { removeUndefinedProperties } from "../utils/removeUndefinedProperties";
import {
  createDataTextureFromRGBE,
  loadImageBitmapFromBlob,
  loadKTX2TextureFromArrayBuffer,
  loadRGBEFromArrayBuffer,
} from "../utils/textures";
import { toTrianglesDrawMode } from "../utils/toTrianglesDrawMode";
import { defineLocalResourceClass } from "./LocalResourceClass";
import { createLocalResourceModule } from "./resource.common";
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
  SamplerMagFilter,
  SamplerMapping,
  SamplerMinFilter,
  SamplerWrap,
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

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";
const KTX2MimeType = "image/ktx2";
const KTX2Extension = ".ktx2";

export class RenderImage extends defineLocalResourceClass(ImageResource) {
  declare bufferView: RenderBufferView | undefined;

  image?: ImageBitmap | RGBE;
  texture?: CompressedTexture;

  async load(ctx: RenderThreadState) {
    const { rgbeLoader, ktx2Loader } = getModule(ctx, RendererModule);

    if (this.bufferView) {
      const bufferView = this.bufferView;
      const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);

      if (this.mimeType === HDRMimeType) {
        this.image = loadRGBEFromArrayBuffer(rgbeLoader, buffer);
      } else if (this.mimeType === KTX2MimeType) {
        // TODO: RenderImage should only store image data and not textures
        this.texture = await loadKTX2TextureFromArrayBuffer(ktx2Loader, buffer);
      } else {
        const blob = new Blob([buffer], { type: this.mimeType });
        this.image = await loadImageBitmapFromBlob(blob, this.flipY);
      }
    } else {
      const uri = this.uri;
      const response = await fetch(uri);

      if (uri.endsWith(HDRExtension)) {
        const buffer = await response.arrayBuffer();
        this.image = loadRGBEFromArrayBuffer(rgbeLoader, buffer);
      } else if (uri.endsWith(KTX2Extension)) {
        const buffer = await response.arrayBuffer();
        // TODO: RenderImage should only store image data and not textures
        this.texture = await loadKTX2TextureFromArrayBuffer(ktx2Loader, buffer);
      } else {
        const blob = await response.blob();
        this.image = await loadImageBitmapFromBlob(blob, this.flipY);
      }
    }
  }

  dispose(ctx: BaseThreadContext) {
    if (this.image instanceof ImageBitmap) {
      this.image.close();
    } else if (this.texture) {
      this.texture.dispose();
    }
  }
}

const ThreeMinFilters: { [key: number]: TextureFilter } = {
  [SamplerMinFilter.NEAREST]: NearestFilter,
  [SamplerMinFilter.LINEAR]: LinearFilter,
  [SamplerMinFilter.NEAREST_MIPMAP_NEAREST]: NearestMipmapNearestFilter,
  [SamplerMinFilter.LINEAR_MIPMAP_NEAREST]: LinearMipmapNearestFilter,
  [SamplerMinFilter.NEAREST_MIPMAP_LINEAR]: NearestMipmapLinearFilter,
  [SamplerMinFilter.LINEAR_MIPMAP_LINEAR]: LinearMipmapLinearFilter,
};

const ThreeMagFilters: { [key: number]: TextureFilter } = {
  [SamplerMagFilter.NEAREST]: NearestFilter,
  [SamplerMagFilter.LINEAR]: LinearFilter,
};

const ThreeWrappings: { [key: number]: Wrapping } = {
  [SamplerWrap.CLAMP_TO_EDGE]: ClampToEdgeWrapping,
  [SamplerWrap.MIRRORED_REPEAT]: MirroredRepeatWrapping,
  [SamplerWrap.REPEAT]: RepeatWrapping,
};

const ThreeMapping: { [key: number]: Mapping } = {
  [SamplerMapping.UVMapping]: UVMapping,
  [SamplerMapping.CubeReflectionMapping]: CubeReflectionMapping,
  [SamplerMapping.CubeRefractionMapping]: CubeRefractionMapping,
  [SamplerMapping.EquirectangularReflectionMapping]: EquirectangularReflectionMapping,
  [SamplerMapping.EquirectangularRefractionMapping]: EquirectangularRefractionMapping,
  [SamplerMapping.CubeUVReflectionMapping]: CubeUVReflectionMapping,
};

// Should never actually be used but allows us to async initialize the texture in load()
const defaultTexture = new Texture();

export class RenderTexture extends defineLocalResourceClass(TextureResource) {
  declare sampler: RenderSampler | undefined;
  declare source: RenderImage;

  texture: Texture = defaultTexture;

  async load(ctx: RenderThreadState) {
    const rendererModule = getModule(ctx, RendererModule);

    let texture;

    if (this.source.texture) {
      texture = this.source.texture;
      // TODO: Can we determine texture encoding when applying to the material?
      texture.encoding = this.encoding as unknown as ThreeTextureEncoding;
      texture.needsUpdate = true;
    } else if (this.source.image instanceof ImageBitmap) {
      // TODO: Add ImageBitmap to Texture types
      texture = new Texture(this.source.image as any);
      texture.flipY = false;
      // TODO: Can we determine texture encoding when applying to the material?
      texture.encoding = this.encoding as unknown as ThreeTextureEncoding;
      texture.needsUpdate = true;
    } else {
      // TODO: RGBE texture encoding should be set in the glTF loader using an extension
      texture = createDataTextureFromRGBE(this.source.image as RGBE);
    }

    const sampler = this.sampler;

    if (sampler) {
      texture.magFilter = ThreeMagFilters[sampler.magFilter];
      texture.minFilter = ThreeMinFilters[sampler.minFilter];
      texture.wrapS = ThreeWrappings[sampler.wrapS];
      texture.wrapT = ThreeWrappings[sampler.wrapT];
      texture.mapping = ThreeMapping[sampler.mapping];
    } else {
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    }

    // Set the texture anisotropy which improves rendering at extreme angles.
    // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
    // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
    texture.anisotropy = Math.min(rendererModule.renderer.capabilities.getMaxAnisotropy(), 8);

    this.texture = texture;
  }

  dispose(ctx: RenderThreadState) {
    if (this.texture && !this.source.texture) {
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

          if (physicalMaterial.map) {
            rendererModule.renderer.initTexture(physicalMaterial.map);
          }

          if (physicalMaterial.metalnessMap) {
            rendererModule.renderer.initTexture(physicalMaterial.metalnessMap);
          }

          if (physicalMaterial.aoMap) {
            rendererModule.renderer.initTexture(physicalMaterial.aoMap);
          }

          if (physicalMaterial.emissiveMap) {
            rendererModule.renderer.initTexture(physicalMaterial.emissiveMap);
          }

          if (physicalMaterial.normalMap) {
            rendererModule.renderer.initTexture(physicalMaterial.normalMap);
          }

          if (physicalMaterial.normalMap) {
            rendererModule.renderer.initTexture(physicalMaterial.normalMap);
          }

          if (physicalMaterial.thicknessMap) {
            rendererModule.renderer.initTexture(physicalMaterial.thicknessMap);
          }

          if (physicalMaterial.transmissionMap) {
            rendererModule.renderer.initTexture(physicalMaterial.transmissionMap);
          }

          physicalMaterial.normalScale.set(
            this.normalTextureScale,
            useDerivativeTangents ? -this.normalTextureScale : this.normalTextureScale
          );

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

          material.normalScale.set(
            this.normalTextureScale,
            useDerivativeTangents ? -this.normalTextureScale : this.normalTextureScale
          );

          if (material.map) {
            rendererModule.renderer.initTexture(material.map);
          }

          if (material.metalnessMap) {
            rendererModule.renderer.initTexture(material.metalnessMap);
          }

          if (material.aoMap) {
            rendererModule.renderer.initTexture(material.aoMap);
          }

          if (material.emissiveMap) {
            rendererModule.renderer.initTexture(material.emissiveMap);
          }

          if (material.normalMap) {
            rendererModule.renderer.initTexture(material.normalMap);
          }
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

        if (material.map) {
          rendererModule.renderer.initTexture(material.map);
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

  async load(ctx: RenderThreadState) {
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

  async load(ctx: RenderThreadState) {
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

  dispose() {
    console.log("dispose render node", this.eid);
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
      const obj = this.tilesRendererObject.group;
      obj.parent?.remove(obj);
      this.tilesRendererObject.dispose();
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
}

const {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
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
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
};
