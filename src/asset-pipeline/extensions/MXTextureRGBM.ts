import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_texture_rgbm";
const PROPERTY_TYPE = "TextureRGBM";

export class MXTextureRGBMExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createTextureRGBM(): MXTextureRGBM {
    return new MXTextureRGBM(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const textureDefs = jsonDoc.json.textures || [];

    textureDefs.forEach((textureDef, textureIndex) => {
      if (textureDef.extensions && textureDef.extensions[EXTENSION_NAME]) {
        const rgbm = this.createTextureRGBM();
        context.textures[textureIndex].setExtension(EXTENSION_NAME, rgbm);
      }
    });

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    this.document
      .getRoot()
      .listTextures()
      .forEach((texture) => {
        const rgbm = texture.getExtension<MXTextureRGBM>(EXTENSION_NAME);

        if (rgbm) {
          const imageIndex = context.imageIndexMap.get(texture);
          const textureDefs = jsonDoc.json.textures || [];

          textureDefs.forEach((textureDef) => {
            if (textureDef.source === imageIndex) {
              textureDef.extensions = textureDef.extensions || {};
              textureDef.extensions[EXTENSION_NAME] = {};
            }
          });
        }
      });

    return this;
  }
}

type IMXTextureRGBM = IProperty;

export class MXTextureRGBM extends ExtensionProperty<IMXTextureRGBM> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.TEXTURE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.TEXTURE];
  }

  protected getDefaults(): Nullable<IMXTextureRGBM> {
    return Object.assign(super.getDefaults() as IProperty, {});
  }
}
