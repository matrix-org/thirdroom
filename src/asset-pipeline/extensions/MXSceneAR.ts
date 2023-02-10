import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_scene_ar";

export class MXSceneARExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createSceneAR(): MXSceneAR {
    return new MXSceneAR(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;

    const sceneDefs = jsonDoc.json.scenes || [];

    sceneDefs.forEach((sceneDef, sceneIndex) => {
      if (!sceneDef.extensions || !sceneDef.extensions[EXTENSION_NAME]) return;
      const postprocessing = this.createSceneAR();
      context.scenes[sceneIndex].setExtension(EXTENSION_NAME, postprocessing);
    });

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    if (this.properties.size === 0) return this;

    this.document
      .getRoot()
      .listScenes()
      .forEach((scene) => {
        const sceneAR = scene.getExtension<MXSceneAR>(EXTENSION_NAME);

        if (sceneAR) {
          const sceneIndex = context.sceneIndexMap.get(scene)!;
          const sceneDef = jsonDoc.json.scenes![sceneIndex];
          sceneDef.extensions = sceneDef.extensions || {};
          sceneDef.extensions[EXTENSION_NAME] = {};
        }
      });

    return this;
  }
}

const POSTPROCESSING_PROPERTY_TYPE = "SceneAR";

type IMXSceneAR = IProperty;

export class MXSceneAR extends ExtensionProperty<IMXSceneAR> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof POSTPROCESSING_PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.SCENE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = POSTPROCESSING_PROPERTY_TYPE;
    this.parentTypes = [PropertyType.SCENE];
  }

  protected getDefaults(): Nullable<IMXSceneAR> {
    return Object.assign(super.getDefaults() as IProperty, {});
  }
}
