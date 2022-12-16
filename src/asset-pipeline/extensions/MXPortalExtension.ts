import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_portal";
const PROPERTY_TYPE = "Portal";

interface PortalExtensionDef {
  uri: string;
}

// NOTE: MX_portal is deprecated. Use OMI_link instead.
export class MXPortalExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createPortal(): MXPortal {
    return new MXPortal(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const nodeDefs = jsonDoc.json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (nodeDef.extensions && nodeDef.extensions[EXTENSION_NAME]) {
        const portal = this.createPortal();

        const extension = nodeDef.extensions[EXTENSION_NAME] as PortalExtensionDef;

        portal.setUri(extension.uri);

        context.nodes[nodeIndex].setExtension(EXTENSION_NAME, portal);
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
        const portal = node.getExtension<MXPortal>(EXTENSION_NAME);

        if (portal) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = {
            uri: portal.getUri(),
          };
        }
      });

    return this;
  }
}

interface IMXPortal extends IProperty {
  uri: string;
}

export class MXPortal extends ExtensionProperty<IMXPortal> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE];
  }

  protected getDefaults(): Nullable<IMXPortal> {
    return Object.assign(super.getDefaults() as IProperty, {
      uri: null,
    });
  }

  public getUri(): string {
    return this.get("uri");
  }

  public setUri(uri: string): this {
    return this.set("uri", uri);
  }
}
