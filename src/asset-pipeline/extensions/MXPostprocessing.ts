import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
} from "@gltf-transform/core";

const EXTENSION_NAME = "MX_postprocessing";

interface BloomEffectDef {
  strength?: number;
  radius?: number;
  threshold?: number;
}

interface PostProcessingExtensionDef {
  bloom?: BloomEffectDef;
}

export class MXPostprocessingExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;

  public createBloomEffect(): MXBloomEffect {
    return new MXBloomEffect(this.document.getGraph());
  }

  public createPostprocessing(): MXPostprocessing {
    return new MXPostprocessing(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;

    const sceneDefs = jsonDoc.json.scenes || [];

    sceneDefs.forEach((sceneDef, sceneIndex) => {
      if (!sceneDef.extensions || !sceneDef.extensions[EXTENSION_NAME]) return;
      const postprocessingDef = sceneDef.extensions[EXTENSION_NAME] as PostProcessingExtensionDef;

      const postprocessing = this.createPostprocessing();

      if (postprocessingDef.bloom) {
        const bloomDef = postprocessingDef.bloom;
        const bloom = this.createBloomEffect();
        if (bloomDef.strength !== undefined) bloom.setStrength(bloomDef.strength);
        if (bloomDef.radius !== undefined) bloom.setRadius(bloomDef.radius);
        if (bloomDef.threshold !== undefined) bloom.setThreshold(bloomDef.threshold);
        postprocessing.setBloom(bloom);
      }

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
        const postprocessing = scene.getExtension<MXPostprocessing>(EXTENSION_NAME);

        if (postprocessing) {
          const sceneIndex = context.sceneIndexMap.get(scene)!;
          const sceneDef = jsonDoc.json.scenes![sceneIndex];
          sceneDef.extensions = sceneDef.extensions || {};

          const extensionDef: PostProcessingExtensionDef = {};

          const bloom = postprocessing.getBloom();

          if (bloom) {
            extensionDef.bloom = {
              strength: bloom.getStrength(),
              radius: bloom.getRadius(),
              threshold: bloom.getThreshold(),
            };
          }

          sceneDef.extensions[EXTENSION_NAME] = extensionDef;
        }
      });

    return this;
  }
}

const POSTPROCESSING_PROPERTY_TYPE = "Postprocessing";
const BLOOM_EFFECT_PROPERTY_TYPE = "BloomEffect";

interface IMXBloomEffect extends IProperty {
  strength: number;
  radius: number;
  threshold: number;
}

export class MXBloomEffect extends ExtensionProperty<IMXBloomEffect> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof BLOOM_EFFECT_PROPERTY_TYPE;
  public declare parentTypes: [typeof POSTPROCESSING_PROPERTY_TYPE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = BLOOM_EFFECT_PROPERTY_TYPE;
    this.parentTypes = [POSTPROCESSING_PROPERTY_TYPE];
  }

  protected getDefaults(): Nullable<IMXBloomEffect> {
    return Object.assign(super.getDefaults() as IProperty, {
      strength: 0.4,
      radius: 0.4,
      threshold: 0.9,
    });
  }

  public getStrength(): number {
    return this.get("strength");
  }

  public setStrength(strength: number): this {
    return this.set("strength", strength);
  }

  public getRadius(): number {
    return this.get("radius");
  }

  public setRadius(radius: number): this {
    return this.set("radius", radius);
  }

  public getThreshold(): number {
    return this.get("threshold");
  }

  public setThreshold(threshold: number): this {
    return this.set("threshold", threshold);
  }
}

interface IMXPostprocessing extends IProperty {
  bloom: MXBloomEffect;
}

export class MXPostprocessing extends ExtensionProperty<IMXPostprocessing> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof POSTPROCESSING_PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.SCENE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = POSTPROCESSING_PROPERTY_TYPE;
    this.parentTypes = [PropertyType.SCENE];
  }

  protected getDefaults(): Nullable<IMXPostprocessing> {
    return Object.assign(super.getDefaults() as IProperty, {
      bloom: null,
    });
  }

  public getBloom(): MXBloomEffect | null {
    return this.getRef("bloom");
  }

  public setBloom(bloom: MXBloomEffect | null): this {
    return this.setRef("bloom", bloom);
  }
}
