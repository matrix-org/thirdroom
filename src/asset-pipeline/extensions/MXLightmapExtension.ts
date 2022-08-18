import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  Texture,
  WriterContext,
  vec2,
  MathUtils,
  GLTF,
  TextureInfo,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_lightmap";
const PROPERTY_TYPE = "Lightmap";

const eq = MathUtils.eq;

interface LightMapDef {
  scale?: vec2;
  offset?: vec2;
  intensity?: number;
  lightMapTexture: GLTF.ITextureInfo;
}

export class MXLightmapExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createLightmap(): MXLightmap {
    return new MXLightmap(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const nodeDefs = jsonDoc.json.nodes || [];
    const textureDefs = jsonDoc.json.textures || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (nodeDef.extensions && nodeDef.extensions[EXTENSION_NAME]) {
        const lightMap = this.createLightmap();
        context.nodes[nodeIndex].setExtension(EXTENSION_NAME, lightMap);
        const lightMapDef = nodeDef.extensions[EXTENSION_NAME] as LightMapDef;

        const textureInfoDef = lightMapDef.lightMapTexture;
        const texture = context.textures[textureDefs[textureInfoDef.index].source!];
        lightMap.setLightMapTexture(texture);
        context.setTextureInfo(lightMap.getLightMapTextureInfo()!, textureInfoDef);

        if (lightMapDef.intensity !== undefined) {
          lightMap.setIntensity(lightMapDef.intensity);
        }

        if (lightMapDef.offset !== undefined) {
          lightMap.setOffset(lightMapDef.offset);
        }

        if (lightMapDef.scale !== undefined) {
          lightMap.setScale(lightMapDef.scale);
        }
      }
    });

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    this.document
      .getRoot()
      .listNodes()
      .forEach((node) => {
        const lightMap = node.getExtension<MXLightmap>(EXTENSION_NAME);

        if (lightMap) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};

          const lightMapDef = (nodeDef.extensions[EXTENSION_NAME] = {} as LightMapDef);

          if (lightMap.getIntensity() !== 1) {
            lightMapDef.intensity = lightMap.getIntensity();
          }

          if (!eq(lightMap.getOffset(), [0, 0])) {
            lightMapDef.offset = lightMap.getOffset();
          }

          if (!eq(lightMap.getScale(), [1, 1])) {
            lightMapDef.scale = lightMap.getScale();
          }

          if (lightMap.getLightMapTexture()) {
            const texture = lightMap.getLightMapTexture()!;
            const textureInfo = lightMap.getLightMapTextureInfo()!;
            lightMapDef.lightMapTexture = context.createTextureInfoDef(texture, textureInfo);
          }
        }
      });

    return this;
  }
}

interface IMXLightmap extends IProperty {
  scale: vec2;
  offset: vec2;
  intensity: number;
  lightMapTexture: Texture;
  lightMapTextureInfo: TextureInfo;
}

export class MXLightmap extends ExtensionProperty<IMXLightmap> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE];
  }

  protected getDefaults(): Nullable<IMXLightmap> {
    return Object.assign(super.getDefaults() as IProperty, {
      scale: [1, 1] as vec2,
      offset: [0, 0] as vec2,
      intensity: 1,
      lightMapTexture: null,
      lightMapTextureInfo: new TextureInfo(this.graph, "lightMapTextureInfo"),
    });
  }

  public getScale(): vec2 {
    return this.get("scale");
  }

  public setScale(scale: vec2): this {
    return this.set("scale", scale);
  }

  public getOffset(): vec2 {
    return this.get("offset");
  }

  public setOffset(offset: vec2): this {
    return this.set("offset", offset);
  }

  public getIntensity(): number {
    return this.get("intensity");
  }

  public setIntensity(intensity: number): this {
    return this.set("intensity", intensity);
  }

  public getLightMapTexture(): Texture | null {
    return this.getRef("lightMapTexture");
  }

  public setLightMapTexture(texture: Texture | null): this {
    return this.setRef("lightMapTexture", texture);
  }

  public getLightMapTextureInfo(): TextureInfo | null {
    return this.getRef("lightMapTexture") ? this.getRef("lightMapTextureInfo") : null;
  }
}
