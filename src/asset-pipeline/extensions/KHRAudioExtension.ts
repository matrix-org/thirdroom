import {
  Extension,
  ExtensionProperty,
  IProperty,
  Nullable,
  PropertyType,
  ReaderContext,
  WriterContext,
  FileUtils,
  BufferUtils,
  JSONDocument,
  Format,
} from "@gltf-transform/core";

import { ICustomPlatformIO } from "../ICustomPlatformIO";

const EXTENSION_NAME = "KHR_audio";

interface SceneEmitterDef {
  emitters: number[];
}

interface NodeEmitterDef {
  emitter: number;
}

interface AudioDataDef {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
}

interface AudioSourceDef {
  audio?: number;
  autoPlay?: boolean;
  gain?: number;
  loop?: boolean;
}

interface AudioEmitterDef {
  type: KHRAudioEmitterType;
  gain?: number;
  sources?: number[];
  positional?: AudioEmitterPositionalDef;
}

interface AudioEmitterPositionalDef {
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: KHRAudioEmitterDistanceModel;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
}

interface AudioExtensionDef {
  audio?: AudioDataDef[];
  sources?: AudioSourceDef[];
  emitters?: AudioEmitterDef[];
}

export class KHRAudioExtension extends Extension {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public readonly extensionName = EXTENSION_NAME;
  public prewriteTypes = [PropertyType.BUFFER];

  public createSceneAudioEmitters(): KHRSceneAudioEmitters {
    return new KHRSceneAudioEmitters(this.document.getGraph());
  }

  public createAudioEmitter(): KHRAudioEmitter {
    return new KHRAudioEmitter(this.document.getGraph());
  }

  public createAudioSource(): KHRAudioSource {
    return new KHRAudioSource(this.document.getGraph());
  }

  public createAudioData(): KHRAudioData {
    return new KHRAudioData(this.document.getGraph());
  }

  public static async beforeReadDocument(io: ICustomPlatformIO, jsonDoc: JSONDocument) {
    if (!jsonDoc.json.extensions || !jsonDoc.json.extensions[EXTENSION_NAME]) return;

    const rootDef = jsonDoc.json.extensions[EXTENSION_NAME] as AudioExtensionDef;

    if (rootDef.audio) {
      await Promise.all(
        rootDef.audio.map(async ({ uri }) => {
          if (!uri || uri.match(/data:/)) return;
          jsonDoc.resources[uri] = await io.readURI(io.resolve(io.dirname(uri), uri), "view");
        })
      );
    }
  }

  public read(context: ReaderContext): this {
    const { json, resources } = context.jsonDoc;

    if (!json.extensions || !json.extensions[EXTENSION_NAME]) return this;

    const rootDef = json.extensions[EXTENSION_NAME] as AudioExtensionDef;

    const audioDataDefs = rootDef.audio || ([] as AudioDataDef[]);
    const audioSourceDefs = rootDef.sources || ([] as AudioSourceDef[]);
    const audioEmitterDefs = rootDef.emitters || ([] as AudioEmitterDef[]);

    const audioData = audioDataDefs.map((audioDataDef) => {
      const audio = this.createAudioData();

      if (audioDataDef.bufferView !== undefined) {
        const bufferViewDef = json.bufferViews![audioDataDef.bufferView];
        const bufferDef = json.buffers![bufferViewDef.buffer];
        const bufferData = bufferDef.uri ? resources[bufferDef.uri] : resources["@glb.bin"];
        const byteOffset = bufferViewDef.byteOffset || 0;
        const byteLength = bufferViewDef.byteLength;
        const data = bufferData.slice(byteOffset, byteOffset + byteLength);
        audio.setData(data);
      } else if (audioDataDef.uri !== undefined) {
        audio.setData(resources[audioDataDef.uri]);

        if (audioDataDef.uri.indexOf("__") !== 0) {
          audio.setURI(audioDataDef.uri);
        }
      }

      return audio;
    });

    const audioSources = audioSourceDefs.map((audioSourceDef) => {
      const audioSource = this.createAudioSource();

      if (audioSourceDef.autoPlay !== undefined) audioSource.setAutoPlay(audioSourceDef.autoPlay);
      if (audioSourceDef.loop !== undefined) audioSource.setLoop(audioSourceDef.loop);
      if (audioSourceDef.gain !== undefined) audioSource.setGain(audioSourceDef.gain);
      if (audioSourceDef.audio !== undefined) audioSource.setAudio(audioData[audioSourceDef.audio]);

      return audioSource;
    });

    const audioEmitters = audioEmitterDefs.map((audioEmitterDef) => {
      const audioEmitter = this.createAudioEmitter();

      audioEmitter.setType(audioEmitterDef.type);

      if (audioEmitterDef.gain !== undefined) audioEmitter.setGain(audioEmitterDef.gain);

      if (audioEmitterDef.sources !== undefined) {
        for (const sourceIndex of audioEmitterDef.sources) {
          audioEmitter.addSource(audioSources[sourceIndex]);
        }
      }

      if (audioEmitterDef.type === KHRAudioEmitter.Type.POSITIONAL && audioEmitterDef.positional) {
        const positionalDef = audioEmitterDef.positional;
        if (positionalDef.coneInnerAngle !== undefined) audioEmitter.setConeInnerAngle(positionalDef.coneInnerAngle);
        if (positionalDef.coneOuterAngle !== undefined) audioEmitter.setConeOuterAngle(positionalDef.coneOuterAngle);
        if (positionalDef.coneOuterGain !== undefined) audioEmitter.setConeOuterGain(positionalDef.coneOuterGain);
        if (positionalDef.distanceModel !== undefined) audioEmitter.setDistanceModel(positionalDef.distanceModel);
        if (positionalDef.maxDistance !== undefined) audioEmitter.setMaxDistance(positionalDef.maxDistance);
        if (positionalDef.refDistance !== undefined) audioEmitter.setRefDistance(positionalDef.refDistance);
        if (positionalDef.rolloffFactor !== undefined) audioEmitter.setRolloffFactor(positionalDef.rolloffFactor);
      }

      return audioEmitter;
    });

    const sceneDefs = json.scenes || [];

    sceneDefs.forEach((sceneDef, sceneIndex) => {
      if (!sceneDef.extensions || !sceneDef.extensions[EXTENSION_NAME]) return;

      const sceneEmitterDef = sceneDef.extensions[EXTENSION_NAME] as SceneEmitterDef;
      const sceneAudioEmitters = this.createSceneAudioEmitters();

      for (const emitterIndex of sceneEmitterDef.emitters) {
        sceneAudioEmitters.addEmitter(audioEmitters[emitterIndex]);
      }

      context.scenes[sceneIndex].setExtension(EXTENSION_NAME, sceneAudioEmitters);
    });

    const nodeDefs = json.nodes || [];

    nodeDefs.forEach((nodeDef, nodeIndex) => {
      if (!nodeDef.extensions || !nodeDef.extensions[EXTENSION_NAME]) return;

      const nodeEmitterDef = nodeDef.extensions[EXTENSION_NAME] as NodeEmitterDef;
      context.nodes[nodeIndex].setExtension(EXTENSION_NAME, audioEmitters[nodeEmitterDef.emitter]);
    });

    return this;
  }

  private audioDataUris = new Map<KHRAudioData, string>();

  public prewrite(context: WriterContext, propertyType: PropertyType): this {
    this.audioDataUris.clear();

    let audioFileCounter = 0;

    for (const property of this.properties) {
      if (property.propertyType === AUDIO_DATA_PROPERTY_TYPE) {
        const audioData = property as KHRAudioData;
        const data = audioData.getData();

        if (data) {
          if (context.options.format === Format.GLB) {
            const glbBuffer = this.document.getRoot().listBuffers()[0];
            const bufferViews = context.otherBufferViews.get(glbBuffer) || [];
            bufferViews.push(data);
            context.otherBufferViews.set(glbBuffer, bufferViews);
          } else {
            const uri = audioData.getURI() || `audio_${audioFileCounter++}.mp3`;
            context.jsonDoc.resources[uri] = data;
            this.audioDataUris.set(audioData, uri);
          }
        }
      }
    }

    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    if (this.properties.size === 0) return this;

    const audioDataDefs: AudioDataDef[] = [];
    const audioDataIndexMap = new Map<KHRAudioData, number>();

    for (const property of this.properties) {
      if (property.propertyType === AUDIO_DATA_PROPERTY_TYPE) {
        const audioData = property as KHRAudioData;
        const audioDataDef: AudioDataDef = {};

        const data = audioData.getData();

        if (data) {
          if (context.options.format === Format.GLB) {
            audioDataDef.mimeType = "audio/mpeg";
            audioDataDef.bufferView = context.otherBufferViewsIndexMap.get(data);
          } else {
            audioDataDef.uri = this.audioDataUris.get(audioData);
          }
        }

        audioDataIndexMap.set(audioData, audioDataDefs.length);
        audioDataDefs.push(audioDataDef);
      }
    }

    const audioSourceDefs: AudioSourceDef[] = [];
    const audioSourceIndexMap = new Map<KHRAudioSource, number>();

    for (const property of this.properties) {
      if (property.propertyType === AUDIO_SOURCE_PROPERTY_TYPE) {
        const audioSource = property as KHRAudioSource;
        const audioSourceDef: AudioSourceDef = {};

        const audioData = audioSource.getAudio();

        if (audioData) {
          const audioDataIndex = audioDataIndexMap.get(audioData);

          if (audioDataIndex !== undefined) {
            audioSourceDef.audio = audioDataIndex;
          }
        }

        if (audioSource.getAutoPlay()) {
          audioSourceDef.autoPlay = true;
        }

        if (audioSource.getLoop()) {
          audioSourceDef.loop = true;
        }

        const gain = audioSource.getGain();

        if (gain !== 1) {
          audioSourceDef.gain = gain;
        }

        audioSourceIndexMap.set(audioSource, audioSourceDefs.length);
        audioSourceDefs.push(audioSourceDef);
      }
    }

    const audioEmitterDefs: AudioSourceDef[] = [];
    const audioEmitterIndexMap = new Map<KHRAudioEmitter, number>();

    for (const property of this.properties) {
      if (property.propertyType === AUDIO_EMITTER_PROPERTY_TYPE) {
        const audioEmitter = property as KHRAudioEmitter;

        const type = audioEmitter.getType();

        const audioEmitterDef: AudioEmitterDef = { type };

        const sources = audioEmitter.listSources().map((source) => audioSourceIndexMap.get(source)!);

        if (sources.length > 0) {
          audioEmitterDef.sources = sources;
        }

        const gain = audioEmitter.getGain();

        if (gain !== 1) {
          audioEmitterDef.gain = gain;
        }

        if (type === KHRAudioEmitter.Type.POSITIONAL) {
          const positionalDef: AudioEmitterPositionalDef = {};

          const coneInnerAngle = audioEmitter.getConeInnerAngle();

          if (coneInnerAngle !== Math.PI * 2) {
            positionalDef.coneInnerAngle = coneInnerAngle;
          }

          const coneOuterAngle = audioEmitter.getConeOuterAngle();

          if (coneOuterAngle !== Math.PI * 2) {
            positionalDef.coneOuterAngle = coneOuterAngle;
          }

          const coneOuterGain = audioEmitter.getConeOuterGain();

          if (coneOuterGain !== 0) {
            positionalDef.coneOuterGain = coneOuterGain;
          }

          const distanceModel = audioEmitter.getDistanceModel();

          if (distanceModel !== KHRAudioEmitter.DistanceModel.INVERSE) {
            positionalDef.distanceModel = distanceModel;
          }

          const maxDistance = audioEmitter.getMaxDistance();

          if (maxDistance !== 10000) {
            positionalDef.maxDistance = maxDistance;
          }

          const refDistance = audioEmitter.getRefDistance();

          if (refDistance !== 1) {
            positionalDef.refDistance = refDistance;
          }

          const rolloffFactor = audioEmitter.getRolloffFactor();

          if (rolloffFactor !== 1) {
            positionalDef.rolloffFactor = rolloffFactor;
          }

          if (Object.keys(positionalDef).length > 0) {
            audioEmitterDef.positional = positionalDef;
          }
        }

        audioEmitterIndexMap.set(audioEmitter, audioEmitterDefs.length);
        audioEmitterDefs.push(audioEmitterDef);
      }
    }

    this.document
      .getRoot()
      .listScenes()
      .forEach((scene) => {
        const audioEmitters = scene.getExtension<KHRSceneAudioEmitters>(EXTENSION_NAME);

        if (audioEmitters) {
          const sceneIndex = context.sceneIndexMap.get(scene)!;
          const sceneDef = jsonDoc.json.scenes![sceneIndex];
          sceneDef.extensions = sceneDef.extensions || {};

          const emitterIndices = audioEmitters
            .listEmitters()
            .map((audioEmitter) => audioEmitterIndexMap.get(audioEmitter));

          sceneDef.extensions[EXTENSION_NAME] = {
            emitters: emitterIndices,
          };
        }
      });

    this.document
      .getRoot()
      .listNodes()
      .forEach((node) => {
        const audioEmitter = node.getExtension<KHRAudioEmitter>(EXTENSION_NAME);

        if (audioEmitter) {
          const nodeIndex = context.nodeIndexMap.get(node)!;
          const nodeDef = jsonDoc.json.nodes![nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[EXTENSION_NAME] = { emitter: audioEmitterIndexMap.get(audioEmitter) };
        }
      });

    jsonDoc.json.extensions = jsonDoc.json.extensions || {};
    jsonDoc.json.extensions[EXTENSION_NAME] = {
      audio: audioDataDefs,
      sources: audioSourceDefs,
      emitters: audioEmitterDefs,
    };

    return this;
  }
}

const SCENE_AUDIO_EMITTERS_PROPERTY_TYPE = "SceneAudioEmitters";

interface IKHRSceneAudioEmitters extends IProperty {
  emitters: KHRAudioEmitter[];
}

export class KHRSceneAudioEmitters extends ExtensionProperty<IKHRSceneAudioEmitters> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof SCENE_AUDIO_EMITTERS_PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.SCENE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = SCENE_AUDIO_EMITTERS_PROPERTY_TYPE;
    this.parentTypes = [PropertyType.SCENE];
  }

  protected getDefaults(): Nullable<IKHRSceneAudioEmitters> {
    return Object.assign(super.getDefaults() as IProperty, {
      emitters: [],
    });
  }

  public listEmitters(): KHRAudioEmitter[] {
    return this.listRefs("emitters");
  }

  public addEmitter(emitter: KHRAudioEmitter): this {
    return this.addRef("emitters", emitter);
  }

  public removeEmitter(emitter: KHRAudioEmitter): this {
    return this.removeRef("emitters", emitter);
  }
}

const AUDIO_EMITTER_PROPERTY_TYPE = "AudioEmitter";

type KHRAudioEmitterType = "global" | "positional";
type KHRAudioEmitterDistanceModel = "inverse" | "linear" | "exponential";

interface IKHRAudioEmitter extends IProperty {
  type: KHRAudioEmitterType;
  gain: number;
  sources: KHRAudioSource[];
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
  distanceModel: KHRAudioEmitterDistanceModel;
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
}

export class KHRAudioEmitter extends ExtensionProperty<IKHRAudioEmitter> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof AUDIO_EMITTER_PROPERTY_TYPE;
  public declare parentTypes: [PropertyType.NODE, typeof SCENE_AUDIO_EMITTERS_PROPERTY_TYPE];

  public static Type: Record<string, KHRAudioEmitterType> = {
    GLOBAL: "global",
    POSITIONAL: "positional",
  };

  public static DistanceModel: Record<string, KHRAudioEmitterDistanceModel> = {
    INVERSE: "inverse",
    LINEAR: "linear",
    EXPONENTIAL: "exponential",
  };

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = AUDIO_EMITTER_PROPERTY_TYPE;
    this.parentTypes = [PropertyType.NODE, SCENE_AUDIO_EMITTERS_PROPERTY_TYPE];
  }

  protected getDefaults(): Nullable<IKHRAudioEmitter> {
    return Object.assign(super.getDefaults() as IProperty, {
      type: KHRAudioEmitter.Type.GLOBAL,
      gain: 1,
      sources: [],
      coneInnerAngle: Math.PI * 2,
      coneOuterAngle: Math.PI * 2,
      coneOuterGain: 0,
      distanceModel: KHRAudioEmitter.DistanceModel.INVERSE,
      maxDistance: 10000,
      refDistance: 1,
      rolloffFactor: 1,
    });
  }

  public getType(): KHRAudioEmitterType {
    return this.get("type");
  }

  public setType(type: KHRAudioEmitterType): this {
    return this.set("type", type);
  }

  public getGain(): number {
    return this.get("gain");
  }

  public setGain(gain: number): this {
    return this.set("gain", gain);
  }

  public listSources(): KHRAudioSource[] {
    return this.listRefs("sources");
  }

  public addSource(source: KHRAudioSource): this {
    return this.addRef("sources", source);
  }

  public removeSource(source: KHRAudioSource): this {
    return this.removeRef("sources", source);
  }

  public getConeInnerAngle(): number {
    return this.get("coneInnerAngle");
  }

  public setConeInnerAngle(coneInnerAngle: number): this {
    return this.set("coneInnerAngle", coneInnerAngle);
  }

  public getConeOuterAngle(): number {
    return this.get("coneOuterAngle");
  }

  public setConeOuterAngle(coneOuterAngle: number): this {
    return this.set("coneOuterAngle", coneOuterAngle);
  }

  public getConeOuterGain(): number {
    return this.get("coneOuterGain");
  }

  public setConeOuterGain(coneOuterGain: number): this {
    return this.set("coneOuterGain", coneOuterGain);
  }

  public getDistanceModel(): KHRAudioEmitterDistanceModel {
    return this.get("distanceModel");
  }

  public setDistanceModel(distanceModel: KHRAudioEmitterDistanceModel): this {
    return this.set("distanceModel", distanceModel);
  }

  public getMaxDistance(): number {
    return this.get("maxDistance");
  }

  public setMaxDistance(maxDistance: number): this {
    return this.set("maxDistance", maxDistance);
  }

  public getRefDistance(): number {
    return this.get("refDistance");
  }

  public setRefDistance(refDistance: number): this {
    return this.set("refDistance", refDistance);
  }

  public getRolloffFactor(): number {
    return this.get("rolloffFactor");
  }

  public setRolloffFactor(rolloffFactor: number): this {
    return this.set("rolloffFactor", rolloffFactor);
  }
}

const AUDIO_SOURCE_PROPERTY_TYPE = "AudioSource";

interface IKHRAudioSource extends IProperty {
  autoPlay: boolean;
  gain: number;
  loop: boolean;
  audio: KHRAudioData;
}

export class KHRAudioSource extends ExtensionProperty<IKHRAudioSource> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof AUDIO_SOURCE_PROPERTY_TYPE;
  public declare parentTypes: [typeof AUDIO_EMITTER_PROPERTY_TYPE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = AUDIO_SOURCE_PROPERTY_TYPE;
    this.parentTypes = [AUDIO_EMITTER_PROPERTY_TYPE];
  }

  protected getDefaults(): Nullable<IKHRAudioSource> {
    return Object.assign(super.getDefaults() as IProperty, {
      autoPlay: false,
      gain: 1,
      loop: false,
      audio: null,
    });
  }

  public getAutoPlay(): boolean {
    return this.get("autoPlay");
  }

  public setAutoPlay(autoPlay: boolean): this {
    return this.set("autoPlay", autoPlay);
  }

  public getLoop(): boolean {
    return this.get("loop");
  }

  public setLoop(loop: boolean): this {
    return this.set("loop", loop);
  }

  public getGain(): number {
    return this.get("gain");
  }

  public setGain(gain: number): this {
    return this.set("gain", gain);
  }

  public getAudio(): KHRAudioData | null {
    return this.getRef("audio");
  }

  public setAudio(audio: KHRAudioData | null): this {
    return this.setRef("audio", audio);
  }
}

const AUDIO_DATA_PROPERTY_TYPE = "AudioData";

interface IKHRAudioData extends IProperty {
  uri: string;
  mimeType: string;
  data: Uint8Array | null;
}

export class KHRAudioData extends ExtensionProperty<IKHRAudioData> {
  public static readonly EXTENSION_NAME = EXTENSION_NAME;
  public declare extensionName: typeof EXTENSION_NAME;
  public declare propertyType: typeof AUDIO_DATA_PROPERTY_TYPE;
  public declare parentTypes: [typeof AUDIO_SOURCE_PROPERTY_TYPE];

  protected init(): void {
    this.extensionName = EXTENSION_NAME;
    this.propertyType = AUDIO_DATA_PROPERTY_TYPE;
    this.parentTypes = [AUDIO_SOURCE_PROPERTY_TYPE];
  }

  protected getDefaults(): Nullable<IKHRAudioData> {
    return Object.assign(super.getDefaults() as IProperty, {
      uri: "",
      mimeType: "",
      data: null,
    });
  }

  public getURI(): string {
    return this.get("uri");
  }

  public setURI(uri: string): this {
    this.set("mimeType", extensionToMimeType(FileUtils.extension(uri)));
    return this.set("uri", uri);
  }

  public getMimeType(): string {
    return this.get("mimeType") || extensionToMimeType(FileUtils.extension(this.getURI()));
  }

  public setMimeType(mimeType: string): this {
    return this.set("mimeType", mimeType);
  }

  public getData(): Uint8Array | null {
    return this.get("data");
  }

  public setData(data: Uint8Array | null): this {
    return this.set("data", BufferUtils.assertView(data));
  }
}

function extensionToMimeType(extension: string) {
  if (extension === "mp3") {
    return "audio/mpeg";
  }

  return `audio/${extension}`;
}
