import { CompressedTexture, DataTexture, FloatType, HalfFloatType, LinearEncoding, LinearFilter } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { RGBE, RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

/**
 * These loader functions allow us to avoid converting from
 * ArrayBuffer -> Blob -> fetch() -> Response -> ArrayBuffer
 * when loading from a glTF where the image data is in a BufferView.
 */

type ArrayBufferKTX2Loader = KTX2Loader & { _createTexture: (buffer: ArrayBuffer) => Promise<CompressedTexture> };

export function loadKTX2TextureFromArrayBuffer(
  ktx2Loader: KTX2Loader,
  buffer: ArrayBuffer
): Promise<CompressedTexture> {
  // TODO: Expose _createTexture publicly in KTX2Loader
  return (ktx2Loader as ArrayBufferKTX2Loader)._createTexture(buffer);
}

interface DataTextureImage {
  data: Float32Array | Uint16Array | Uint8Array;
  width: number;
  height: number;
}

export function loadRGBEFromArrayBuffer(rgbeLoader: RGBELoader, buffer: ArrayBuffer): RGBE {
  const texData = rgbeLoader.parse(buffer) as RGBE | null;

  if (!texData) {
    throw new Error("Error parsing RGBE texture.");
  }

  if (!(texData.type === FloatType || texData.type === HalfFloatType)) {
    throw new Error("Unsupported RGBE texture type");
  }

  return texData;
}

export function createDataTextureFromRGBE(texData: RGBE) {
  const texture = new DataTexture();

  // TODO: Three.js types are wrong here
  const image = texture.image as unknown as DataTextureImage;

  image.width = texData.width;
  image.height = texData.height;
  image.data = texData.data;
  texture.type = texData.type;
  texture.needsUpdate = true;
  texture.encoding = LinearEncoding;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;

  return texture;
}

export function loadImageBitmapFromBlob(blob: Blob, flipY: boolean): Promise<ImageBitmap> {
  return createImageBitmap(blob, {
    premultiplyAlpha: "none",
    imageOrientation: flipY ? "flipY" : undefined,
    colorSpaceConversion: "none",
  });
}
