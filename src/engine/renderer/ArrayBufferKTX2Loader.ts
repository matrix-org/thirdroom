import { KTX2Container } from "ktx-parse";
import { CompressedPixelFormat, CompressedTexture, DataTexture, Data3DTexture } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";

export interface KTX2TranscodeResult {
  type: "transcode";
  mipmaps: ImageData[];
  width: number;
  height: number;
  hasAlpha: boolean;
  format: CompressedPixelFormat;
  dfdTransferFn: number;
  dfdFlags: number;
}

export type KTX2RenderImageData = KTX2Container | KTX2TranscodeResult;

interface KTX2TranscodeError {
  type: "error";
  error: string;
}

export type ArrayBufferKTX2Loader = KTX2Loader & {
  init(): Promise<void>;
  _readKTX2Container(buffer: ArrayBuffer): Promise<KTX2Container>;
  _transcodeTexture(
    buffer: ArrayBuffer,
    config?: unknown
  ): Promise<MessageEvent<KTX2TranscodeResult | KTX2TranscodeError>>;
  _loadTextureFromTranscodeResult(transcodeResult: KTX2TranscodeResult, texture: CompressedTexture): void;
  _loadTextureFromKTX2Container<T extends DataTexture | Data3DTexture>(
    container: KTX2Container,
    texture: T
  ): Promise<T>;
};
