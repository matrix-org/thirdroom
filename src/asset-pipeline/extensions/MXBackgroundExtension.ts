import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
  GLTF,
  Texture,
  TextureInfo,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_background";
const PROPERTY_TYPE = "Background";

interface BackgroundExtensionDef {
  backgroundTexture: GLTF.ITextureInfo;
}

export class MXBackgroundExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createBackground(): MXBackground {
    return new MXBackground(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;

    const textureDefs = jsonDoc.json.textures || [];
    const sceneDefs = jsonDoc.json.scenes || [];

    sceneDefs.forEach((sceneDef, sceneIndex) => {
      if (!sceneDef.extensions || !sceneDef.extensions[EXTENSION_NAME]) return;
      const background = this.createBackground();
      const backgroundDef = sceneDef.extensions[EXTENSION_NAME] as BackgroundExtensionDef;
      const textureInfoDef = backgroundDef.backgroundTexture;
      const texture = context.textures[textureDefs[textureInfoDef.index].source!];
      background.setBackgroundTexture(texture);
      context.setTextureInfo(background.getBackgroundTextureInfo()!, textureInfoDef);
      context.scenes[sceneIndex].setExtension(EXTENSION_NAME, background);
    });

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    this.document
      .getRoot()
      .listScenes()
      .forEach((scene) => {
        const background = scene.getExtension<MXBackground>(EXTENSION_NAME);

        if (background) {
          const sceneIndex = context.sceneIndexMap.get(scene)!;
          const sceneDef = jsonDoc.json.scenes![sceneIndex];
          sceneDef.extensions = sceneDef.extensions || {};

          const texture = background.getBackgroundTexture()!;
          const textureInfo = background.getBackgroundTextureInfo()!;

          sceneDef.extensions[EXTENSION_NAME] = {
            backgroundTexture: context.createTextureInfoDef(texture, textureInfo),
          };
        }
      });

    return this;
  }
}

interface IMXBackground extends IProperty {
  backgroundTexture: Texture;
  backgroundTextureInfo: TextureInfo;
}

export class MXBackground extends ExtensionProperty<IMXBackground> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.SCENE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.SCENE];
  }

  protected getDefaults(): Nullable<IMXBackground> {
    return Object.assign(super.getDefaults() as IProperty, {
      backgroundTexture: null,
      backgroundTextureInfo: new TextureInfo(this.graph, "backgroundTextureInfo"),
    });
  }

  public getBackgroundTexture(): Texture | null {
    return this.getRef("backgroundTexture");
  }

  public setBackgroundTexture(texture: Texture | null): this {
    return this.setRef("backgroundTexture", texture);
  }

  public getBackgroundTextureInfo(): TextureInfo | null {
    return this.getRef("backgroundTexture") ? this.getRef("backgroundTextureInfo") : null;
  }
}
