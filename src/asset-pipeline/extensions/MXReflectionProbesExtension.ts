import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
  vec3,
  GLTF,
  Texture,
  TextureInfo,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_reflection_probes";
const PROPERTY_TYPE = "ReflectionProbe";

interface ReflectionProbeRefDef {
  reflectionProbe: number;
}

interface ReflectionProbeDef {
  size?: vec3;
  reflectionProbeTexture: GLTF.ITextureInfo;
}

interface ReflectionProbesExtensionDef {
  reflectionProbes: ReflectionProbeDef[];
}

export class MXReflectionProbesExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createReflectionProbe(): MXReflectionProbe {
    return new MXReflectionProbe(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;

    if (!jsonDoc.json.extensions || !jsonDoc.json.extensions[EXTENSION_NAME]) return this;

    const rootDef = jsonDoc.json.extensions[EXTENSION_NAME] as ReflectionProbesExtensionDef;

    const reflectionProbeDefs = rootDef.reflectionProbes || ([] as ReflectionProbeDef[]);
    const textureDefs = jsonDoc.json.textures || [];

    const reflectionProbes = reflectionProbeDefs.map((reflectionProbeDef) => {
      const reflectionProbe = this.createReflectionProbe();

      reflectionProbe.setSize(reflectionProbeDef.size || null);

      const textureInfoDef = reflectionProbeDef.reflectionProbeTexture;
      const texture = context.textures[textureDefs[textureInfoDef.index].source!];
      reflectionProbe.setReflectionProbeTexture(texture);
      context.setTextureInfo(reflectionProbe.getReflectionProbeTextureInfo()!, textureInfoDef);

      return reflectionProbe;
    });

    const nodeDefs = jsonDoc.json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (!nodeDef.extensions || !nodeDef.extensions[EXTENSION_NAME]) return;
      const reflectionProbeRefDef = nodeDef.extensions[EXTENSION_NAME] as ReflectionProbeRefDef;
      context.nodes[nodeIndex].setExtension(EXTENSION_NAME, reflectionProbes[reflectionProbeRefDef.reflectionProbe]);
    });

    const sceneDefs = jsonDoc.json.scenes || [];

    sceneDefs.forEach((sceneDef, sceneIndex) => {
      if (!sceneDef.extensions || !sceneDef.extensions[EXTENSION_NAME]) return;
      const reflectionProbeRefDef = sceneDef.extensions[EXTENSION_NAME] as ReflectionProbeRefDef;
      context.scenes[sceneIndex].setExtension(EXTENSION_NAME, reflectionProbes[reflectionProbeRefDef.reflectionProbe]);
    });

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    if (this.properties.size === 0) return this;

    const reflectionProbeDefs = [];
    const reflectionProbeIndexMap = new Map<MXReflectionProbe, number>();

    for (const property of this.properties) {
      const reflectionProbe = property as MXReflectionProbe;

      const texture = reflectionProbe.getReflectionProbeTexture()!;
      const textureInfo = reflectionProbe.getReflectionProbeTextureInfo()!;

      const reflectionProbeDef: ReflectionProbeDef = {
        reflectionProbeTexture: context.createTextureInfoDef(texture, textureInfo),
      };

      const size = reflectionProbe.getSize();

      if (size) {
        reflectionProbeDef.size = size;
      }

      reflectionProbeDefs.push(reflectionProbeDef);

      reflectionProbeIndexMap.set(reflectionProbe, reflectionProbeDefs.length - 1);
    }

    this.document
      .getRoot()
      .listNodes()
      .forEach((node) => {
        const reflectionProbe = node.getExtension<MXReflectionProbe>(EXTENSION_NAME);

        if (reflectionProbe) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = { reflectionProbe: reflectionProbeIndexMap.get(reflectionProbe) };
        }
      });

    this.document
      .getRoot()
      .listScenes()
      .forEach((scene) => {
        const reflectionProbe = scene.getExtension<MXReflectionProbe>(EXTENSION_NAME);

        if (reflectionProbe) {
          const sceneIndex = context.sceneIndexMap.get(scene)!;
          const sceneDef = jsonDoc.json.scenes![sceneIndex];
          sceneDef.extensions = sceneDef.extensions || {};
          sceneDef.extensions[EXTENSION_NAME] = { reflectionProbe: reflectionProbeIndexMap.get(reflectionProbe) };
        }
      });

    jsonDoc.json.extensions = jsonDoc.json.extensions || {};
    jsonDoc.json.extensions[EXTENSION_NAME] = { reflectionProbes: reflectionProbeDefs };

    return this;
  }
}

interface IMXReflectionProbe extends IProperty {
  size: vec3 | null;
  reflectionProbeTexture: Texture;
  reflectionProbeTextureInfo: TextureInfo;
}

export class MXReflectionProbe extends ExtensionProperty<IMXReflectionProbe> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.SCENE, PropertyType.NODE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.SCENE, PropertyType.NODE];
  }

  protected getDefaults(): Nullable<IMXReflectionProbe> {
    return Object.assign(super.getDefaults() as IProperty, {
      size: null,
      reflectionProbeTexture: null,
      reflectionProbeTextureInfo: new TextureInfo(this.graph, "reflectionProbeTextureInfo"),
    });
  }

  public getSize(): vec3 | null {
    return this.get("size");
  }

  public setSize(size: vec3 | null): this {
    return this.set("size", size);
  }

  public getReflectionProbeTexture(): Texture | null {
    return this.getRef("reflectionProbeTexture");
  }

  public setReflectionProbeTexture(texture: Texture | null): this {
    return this.setRef("reflectionProbeTexture", texture);
  }

  public getReflectionProbeTextureInfo(): TextureInfo | null {
    return this.getRef("reflectionProbeTexture") ? this.getRef("reflectionProbeTextureInfo") : null;
  }
}
