import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "OMI_link";
const PROPERTY_TYPE = "Link";

interface LinkExtensionDef {
  uri: string;
}

export class OMILinkExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createLink(): OMILink {
    return new OMILink(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const nodeDefs = jsonDoc.json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (nodeDef.extensions && nodeDef.extensions[EXTENSION_NAME]) {
        const link = this.createLink();

        const extension = nodeDef.extensions[EXTENSION_NAME] as LinkExtensionDef;

        link.setUri(extension.uri);

        context.nodes[nodeIndex].setExtension(EXTENSION_NAME, link);
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
        const link = node.getExtension<OMILink>(EXTENSION_NAME);

        if (link) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = {
            uri: link.getUri(),
          };
        }
      });

    return this;
  }
}

interface IOMILink extends IProperty {
  uri: string;
}

export class OMILink extends ExtensionProperty<IOMILink> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE];
  }

  protected getDefaults(): Nullable<IOMILink> {
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
