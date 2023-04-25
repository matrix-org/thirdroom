import {
  Extension,
  ExtensionProperty,
  IProperty,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_static";
const PROPERTY_TYPE = "Static";

export class MXStaticExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createStatic(): MXStatic {
    return new MXStatic(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const nodeDefs = jsonDoc.json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (nodeDef.extensions && nodeDef.extensions[EXTENSION_NAME]) {
        const isStatic = this.createStatic();
        context.nodes[nodeIndex].setExtension(EXTENSION_NAME, isStatic);
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
        const spawnPoint = node.getExtension<MXStatic>(EXTENSION_NAME);

        if (spawnPoint) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = {};
        }
      });

    return this;
  }
}

export class MXStatic extends ExtensionProperty<IProperty> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE];
  }
}
