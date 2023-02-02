import { Document, Texture, Transform } from "@gltf-transform/core";
import { TextureBasisu } from "@gltf-transform/extensions";
import { listTextureSlots } from "@gltf-transform/functions";

import { createDeferred, Deferred } from "../../engine/utils/Deferred";
import { GLTFTransformProgressCallback } from "../web";
import TextureCompressionWorker from "./TextureCompressionWorker?worker";

export function compressTextures(onProgress?: GLTFTransformProgressCallback): Transform {
  return async (doc: Document) => {
    const root = doc.getRoot();

    let nextJobId = 0;
    const jobs: Map<number, Deferred<{ jobId: number; data: Uint8Array; mimeType: string }>> = new Map();
    const textureMap: Map<number, Texture> = new Map();
    const workers: Worker[] = [];

    const numWorkers = navigator.hardwareConcurrency || 4;
    let completedJobs = 0;

    if (onProgress) {
      onProgress({
        step: "Compressing textures with Basis Universal Texture Compression...",
        status: `Using ${numWorkers} threads. Initializing...`,
      });
    }

    for (let i = 0; i < numWorkers; i++) {
      const worker = new TextureCompressionWorker();

      worker.addEventListener("message", (event) => {
        const jobId = event.data.jobId;

        if (event.data.error) {
          jobs.get(jobId)!.reject(new Error("Error compressing texture"));
        } else {
          completedJobs++;

          if (onProgress) {
            onProgress({
              step: "Compressing textures with Basis Universal Texture Compression...",
              status: `Using ${numWorkers} threads. ${jobs.size - completedJobs} / ${jobs.size} textures remaining.`,
            });
          }

          jobs.get(jobId)!.resolve(event.data);
        }
      });

      workers.push(worker);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const start = performance.now();

    let usesBasisExtension = false;

    for (const texture of root.listTextures()) {
      const mimeType = texture.getMimeType();

      // Skip any non png/jpeg textures
      if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
        continue;
      }

      let imageData: Uint8Array | Uint8ClampedArray | null = texture.getImage();
      const size = texture.getSize();

      if (!imageData || !size) {
        continue;
      }

      const name = texture.getName() || texture.getURI();
      const slots = listTextureSlots(doc, texture);
      const isSRGB = slots.some((slotName) => slotName === "baseColorTexture" || slotName === "emissiveTexture");
      const isNormal = slots.some((slotName) => slotName === "normalTexture");
      const flipY = slots.some((slotName) => slotName === "backgroundTexture");

      const workerIndex = jobs.size % workers.length;
      const worker = workers[workerIndex];

      const useOptiPng = texture
        .listParents()
        .some((prop) => prop.propertyType === "ReflectionProbe" || prop.propertyType === "Lightmap");

      if (useOptiPng && mimeType === "image/jpeg") {
        continue;
      }

      if (mimeType === "image/jpeg") {
        const originalByteLength = imageData.byteLength;
        canvas.width = size[0];
        canvas.height = size[1];
        ctx.clearRect(0, 0, size[0], size[1]);
        const bitmap = await createImageBitmap(new Blob([imageData], { type: mimeType }));
        ctx.drawImage(bitmap, 0, 0);
        imageData = ctx.getImageData(0, 0, size[0], size[1]).data;
        bitmap.close();

        console.log(
          `Converted image from jpeg to bitmap:
  Width: ${size[0]}
  Height: ${size[1]}
  JPEG Byte Length: ${originalByteLength}
  Bitmap Byte Length: ${imageData.byteLength}`
        );
      }

      const jobId = nextJobId++;

      textureMap.set(jobId, texture);
      jobs.set(jobId, createDeferred(false));

      worker.postMessage(
        {
          jobId,
          name,
          slots,
          isSRGB,
          isNormal,
          useOptiPng,
          size,
          data: imageData,
          mimeType,
          flipY,
        },
        [imageData.buffer]
      );
    }

    const results = await Promise.all(Array.from(jobs.values()).map((job) => job.promise));

    for (const worker of workers) {
      worker.terminate();
    }

    for (const result of results) {
      const texture = textureMap.get(result.jobId) as Texture;
      texture.setImage(result.data);
      texture.setMimeType(result.mimeType);

      if (result.mimeType === "image/ktx2") {
        usesBasisExtension = true;
      }
    }

    if (usesBasisExtension) {
      doc.createExtension(TextureBasisu).setRequired(true);
    }

    const duration = ((performance.now() - start) / 1000).toFixed(1);

    console.log(`Total texture compression time: ${duration} secs`);
  };
}
