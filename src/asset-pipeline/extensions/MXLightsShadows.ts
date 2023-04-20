import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_lights_shadows";
const PROPERTY_TYPE = "Shadows";

interface LightsShadowsDef {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export class MXLightsShadowsExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createLightsShadows(): MXLightsShadows {
    return new MXLightsShadows(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const nodeDefs = jsonDoc.json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (nodeDef.extensions && nodeDef.extensions[EXTENSION_NAME]) {
        const shadows = this.createLightsShadows();

        const extension = nodeDef.extensions[EXTENSION_NAME] as LightsShadowsDef;

        if (extension.castShadow !== undefined) {
          shadows.setCastShadow(extension.castShadow);
        }

        if (extension.receiveShadow !== undefined) {
          shadows.setReceiveShadow(extension.receiveShadow);
        }

        context.nodes[nodeIndex].setExtension(EXTENSION_NAME, shadows);
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
        const shadows = node.getExtension<MXLightsShadows>(EXTENSION_NAME);

        if (shadows) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = {
            castShadow: shadows.getCastShadow(),
            receiveShadow: shadows.getReceiveShadow(),
          };
        }
      });

    return this;
  }
}

interface IMXLightsShadows extends IProperty {
  castShadow: boolean;
  receiveShadow: boolean;
}

export class MXLightsShadows extends ExtensionProperty<IMXLightsShadows> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE];
  }

  protected getDefaults(): Nullable<IMXLightsShadows> {
    return Object.assign(super.getDefaults() as IProperty, {
      castShadow: null,
      receiveShadow: null,
    });
  }

  public getCastShadow(): boolean {
    return this.get("castShadow");
  }

  public setCastShadow(castShadow: boolean): this {
    return this.set("castShadow", castShadow);
  }

  public getReceiveShadow(): boolean {
    return this.get("receiveShadow");
  }

  public setReceiveShadow(receiveShadow: boolean): this {
    return this.set("receiveShadow", receiveShadow);
  }
}
