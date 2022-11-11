import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
  vec3,
  Mesh,
} from "@gltf-transform/core";

const EXTENSION_NAME = "OMI_collider";
const PROPERTY_TYPE = "Collider";

interface NodeColliderDef {
  collider: number;
}

interface ColliderDef {
  type: OMIColliderType;
  extents?: vec3;
  radius?: number;
  height?: number;
  mesh?: number;
}

interface ColliderExtensionDef {
  colliders: ColliderDef[];
}

export class OMIColliderExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createCollider(): OMICollider {
    return new OMICollider(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;

    if (!jsonDoc.json.extensions || !jsonDoc.json.extensions[EXTENSION_NAME]) return this;

    const rootDef = jsonDoc.json.extensions[EXTENSION_NAME] as ColliderExtensionDef;

    const colliderDefs = rootDef.colliders || ([] as ColliderDef[]);

    const colliders = colliderDefs.map((colliderDef) => {
      const collider = this.createCollider().setType(colliderDef.type);

      if (colliderDef.extents !== undefined) collider.setExtents(colliderDef.extents);
      if (colliderDef.radius !== undefined) collider.setRadius(colliderDef.radius);
      if (colliderDef.height !== undefined) collider.setHeight(colliderDef.height);
      if (colliderDef.mesh !== undefined) collider.setMesh(context.meshes[colliderDef.mesh!]);

      return collider;
    });

    const nodeDefs = jsonDoc.json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (!nodeDef.extensions || !nodeDef.extensions[EXTENSION_NAME]) return;
      const colliderNodeDef = nodeDef.extensions[EXTENSION_NAME] as NodeColliderDef;
      context.nodes[nodeIndex].setExtension(EXTENSION_NAME, colliders[colliderNodeDef.collider]);
    });

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    if (this.properties.size === 0) return this;

    const colliderDefs = [];
    const colliderIndexMap = new Map<OMICollider, number>();

    for (const property of this.properties) {
      const collider = property as OMICollider;
      const colliderType = collider.getType();
      const colliderDef = { type: colliderType } as ColliderDef;

      if (colliderType === OMICollider.Type.BOX) {
        colliderDef.extents = collider.getExtents()!;
      } else if (colliderType === OMICollider.Type.MESH) {
        colliderDef.mesh = context.meshIndexMap.get(collider.getMesh()!);
      } else if (colliderType === OMICollider.Type.SPHERE) {
        colliderDef.radius = collider.getRadius()!;
      } else if (colliderType === OMICollider.Type.CAPSULE) {
        colliderDef.height = collider.getHeight()!;
        colliderDef.radius = collider.getRadius()!;
      }

      colliderDefs.push(colliderDef);
      colliderIndexMap.set(collider, colliderDefs.length - 1);
    }

    this.document
      .getRoot()
      .listNodes()
      .forEach((node) => {
        const collider = node.getExtension<OMICollider>(EXTENSION_NAME);

        if (collider) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = { collider: colliderIndexMap.get(collider) };
        }
      });

    jsonDoc.json.extensions = jsonDoc.json.extensions || {};
    jsonDoc.json.extensions[EXTENSION_NAME] = { colliders: colliderDefs };

    return this;
  }
}

type OMIColliderType = "box" | "mesh" | "sphere" | "capsule" | "hull" | "compound";

interface IOMICollider extends IProperty {
  type: OMIColliderType;
  extents: vec3 | null;
  radius: number | null;
  height: number | null;
  mesh: Mesh;
}

export class OMICollider extends ExtensionProperty<IOMICollider> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE];

  public static Type: Record<string, OMIColliderType> = {
    MESH: "mesh",
    BOX: "box",
    SPHERE: "sphere",
    CAPSULE: "capsule",
    HULL: "hull",
    COMPOUND: "compound",
  };

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE];
  }

  protected getDefaults(): Nullable<IOMICollider> {
    return Object.assign(super.getDefaults() as IProperty, {
      type: null,
      extents: null,
      radius: null,
      height: null,
      mesh: null,
    });
  }

  public getType(): OMIColliderType {
    return this.get("type");
  }

  public setType(type: OMIColliderType): this {
    return this.set("type", type);
  }

  public getExtents(): vec3 | null {
    return this.get("extents");
  }

  public setExtents(extents: vec3 | null): this {
    return this.set("extents", extents);
  }

  public getRadius(): number | null {
    return this.get("radius");
  }

  public setRadius(radius: number | null): this {
    return this.set("radius", radius);
  }

  public getHeight(): number | null {
    return this.get("height");
  }

  public setHeight(height: number | null): this {
    return this.set("height", height);
  }

  public getMesh(): Mesh | null {
    return this.getRef("mesh");
  }

  public setMesh(mesh: Mesh | null): this {
    return this.setRef("mesh", mesh);
  }
}
