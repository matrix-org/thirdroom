import { BufferSource } from "stream/web";

export async function loadGLTFFromUrl(src: string, signal?: AbortSignal) {
  const gltfResponse = await fetch(src, { signal });

  if (!gltfResponse.ok) {
    throw new Error(`Error loading glTF "${src}"\n\n\t${gltfResponse.status} ${gltfResponse.statusText}\n\t`);
  }

  const buffer = await gltfResponse.arrayBuffer();

  const headerElements = 5;
  const [magic, version, glbLength, jsonChunkLength] = new Uint32Array(buffer, 0, headerElements);
  const headerLength = Uint32Array.BYTES_PER_ELEMENT * headerElements;

  const isGLB = magic === 0x46546c67;

  let jsonChunk: BufferSource | undefined;
  let binChunk: BufferSource | undefined;

  if (isGLB) {
    if (version !== 2) {
      throw new Error(`Unsupported glTF version ${version}`);
    }

    jsonChunk = buffer.slice(headerLength, headerLength + jsonChunkLength);

    if (glbLength > headerLength + jsonChunkLength) {
      const binChunkHeaderElements = 2;
      const [binChunkLength] = new Uint32Array(buffer, headerLength + jsonChunkLength, binChunkHeaderElements);
      const binChunkHeaderLength = binChunkHeaderElements * Uint32Array.BYTES_PER_ELEMENT;

      binChunk = buffer.slice(
        headerLength + jsonChunkLength + binChunkHeaderLength,
        headerLength + jsonChunkLength + binChunkHeaderLength + binChunkLength
      );
    }
  } else {
    jsonChunk = buffer;
  }

  const jsonStr = new TextDecoder().decode(jsonChunk);
  const json = JSON.parse(jsonStr);

  return loadGLTF(json, { rootUrl: gltfResponse.url, binChunk, signal });
}

interface GLTFLoaderContext {
  rootUrl: string;
  binChunk?: BufferSource;
  signal?: AbortSignal;
}

async function loadGLTF(json: any, context: GLTFLoaderContext) {
  const version = json.asset.version;

  if (version !== "2.0") {
    throw new Error(`Unsupported glTF version ${version}`);
  }

  const buffers = await loadBuffers(json, context);

  const bufferViews = createBufferViews(json, buffers, context);

  const images = await loadImages(json, bufferViews, context);

  console.log({ buffers, bufferViews, images });
}

async function loadBuffer(bufferDef: any, bufferIndex: number, context: GLTFLoaderContext): Promise<BufferSource> {
  if (bufferDef.uri) {
    const url = new URL(bufferDef.uri, context.rootUrl);
    const response = await fetch(url.href, { signal: context.signal });

    if (!response.ok) {
      throw new Error(
        `Error loading glTF buffer "${bufferDef.uri}"\n\n\t${response.status} ${response.statusText}\n\t`
      );
    }

    return response.arrayBuffer();
  }

  if (bufferIndex !== 0) {
    throw new Error(
      `Error loading glTF "${context.rootUrl}"\n\n\t: buffer ${bufferIndex} does not have a uri defined.\n\t`
    );
  }

  if (!context.binChunk) {
    throw new Error(`${context.rootUrl}: glb binary chunk was not found.`);
  }

  return context.binChunk;
}

async function loadBuffers(json: any, context: GLTFLoaderContext): Promise<BufferSource[]> {
  const buffers = json.buffers || [];

  return Promise.all(buffers.map((bufferDef: any, bufferIndex: number) => loadBuffer(bufferDef, bufferIndex, context)));
}

interface BufferView {
  view: Uint8Array;
  byteStride?: number;
  target?: number;
}

function createBufferViews(json: any, buffers: BufferSource[], context: GLTFLoaderContext): BufferView[] {
  const bufferViews: any[] = json.bufferViews || [];

  return bufferViews.map((bufferViewDef: any, bufferViewIndex: number) => {
    const { buffer: bufferIndex, byteOffset, byteLength, byteStride, target } = bufferViewDef;
    const buffer = buffers[bufferIndex];

    if (!buffer) {
      throw new Error(
        `Error loading glTF "${context.rootUrl}"\n\n\t: Cannot find buffer ${bufferIndex} for bufferView ${bufferViewIndex}.\n\t`
      );
    }

    let view: Uint8Array;

    const offset = byteOffset || 0;

    if (buffer instanceof ArrayBuffer) {
      view = new Uint8Array(buffer, offset, byteLength);
    } else {
      view = new Uint8Array(buffer.buffer, buffer.byteOffset + offset, byteLength);
    }

    return {
      view,
      byteStride,
      target,
    } as BufferView;
  });
}

const imageBitmapOptions: ImageBitmapOptions = { premultiplyAlpha: "none", colorSpaceConversion: "none" };

async function loadImage(
  imageDef: any,
  imageIndex: number,
  bufferViews: BufferView[],
  context: GLTFLoaderContext
): Promise<ImageBitmap> {
  if (imageDef.uri) {
    const url = new URL(imageDef.uri, context.rootUrl);
    const response = await fetch(url.href, { signal: context.signal });

    if (!response.ok) {
      throw new Error(
        `Error loading glTF "${context.rootUrl}"\n\n\t: Error loading image "${imageDef.uri}": ${response.status} ${response.statusText}\n\t`
      );
    }

    const blob = await response.blob();

    return createImageBitmap(blob, imageBitmapOptions);
  }

  const bufferView = bufferViews[imageDef.bufferView];

  if (!bufferView) {
    throw new Error(
      `Error loading glTF "${context.rootUrl}"\n\n\t: Error loading image at index ${imageIndex}: bufferView not defined\n\t`
    );
  }

  const blob = new Blob([bufferView.view], { type: imageDef.mimeType });

  return createImageBitmap(blob, imageBitmapOptions);
}

async function loadImages(json: any, bufferViews: BufferView[], context: GLTFLoaderContext): Promise<ImageBitmap[]> {
  const images = json.images || [];

  return Promise.all(
    images.map((imageDef: any, imageIndex: number) => loadImage(imageDef, imageIndex, bufferViews, context))
  );
}
