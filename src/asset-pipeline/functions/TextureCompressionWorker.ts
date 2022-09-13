import { vec2 } from "@gltf-transform/core";
import optipng from "optipng-js";

import basisEncoderWasmUrl from "../vendor/basis/basis_encoder.wasm?url";

const jobs: Job[] = [];
let processingJob = false;
let BasisEncoder: any;

self.onmessage = (event) => {
  jobs.push(event.data);
  processJob().catch(console.error);
};

async function main() {
  const { BasisModule } = (await import("../vendor/basis/basis_encoder.js" as any)) as any;

  const Basis = await BasisModule({
    locateFile(path: string) {
      if (path.endsWith(".wasm")) {
        return basisEncoderWasmUrl;
      }
    },
  });

  Basis.initializeBasis();

  BasisEncoder = Basis.BasisEncoder;

  processJob().catch(console.error);
}

interface Job {
  jobId: number;
  name: string;
  slots: string[];
  size: vec2;
  isSRGB: boolean;
  isNormal: boolean;
  useOptiPng: boolean;
  data: Uint8Array | Uint8ClampedArray;
  mimeType: string;
}

async function processJob() {
  if (!BasisEncoder) {
    return;
  }

  if (processingJob) {
    return;
  }

  const job = jobs.pop();

  if (!job) {
    return;
  }

  processingJob = true;

  const { jobId, name, slots, size, useOptiPng, isSRGB, isNormal, data, mimeType } = job;

  console.log(
    `Compressing texture "${name}" with ${useOptiPng ? "OptiPNG" : isSRGB ? "ETC1S" : "UASTC"} compression.
  Original Size: ${(data.byteLength / 1000000).toFixed(2)}MB
  Used As: ${slots.join(", ")}
`
  );

  const start = performance.now();

  let outBuffer: Uint8Array;
  let outMimeType: string;

  if (useOptiPng) {
    const output = optipng(data, ["-o2"], console.log);
    outBuffer = output.data;
    outMimeType = "image/png";
  } else {
    const tempOutputBuffer = new Uint8Array(size[0] * size[1] * 4);

    const basisEncoder = new BasisEncoder();

    basisEncoder.setCreateKTX2File(true);
    basisEncoder.setKTX2UASTCSupercompression(true);
    basisEncoder.setKTX2SRGBTransferFunc(isSRGB);

    if (isSRGB) {
      basisEncoder.setUASTC(false);
      basisEncoder.setQualityLevel(255);
    } else {
      basisEncoder.setUASTC(true);
      basisEncoder.setRDOUASTC(true);
      basisEncoder.setRDOUASTCQualityScalar(10);
    }

    basisEncoder.setDebug(true);

    basisEncoder.setMipGen(true);

    basisEncoder.setSliceSourceImage(0, data, size[0], size[1], mimeType === "image/png");

    if (isNormal) {
      basisEncoder.setNormalMap();
      basisEncoder.setRenormalize(true);
      basisEncoder.setMipRenormalize(true);
    } else {
      basisEncoder.setPerceptual(isSRGB);
      basisEncoder.setMipSRGB(isSRGB);
    }

    const numOutputBytes = basisEncoder.encode(tempOutputBuffer);
    outBuffer = new Uint8Array(tempOutputBuffer.buffer, 0, numOutputBytes);
    outMimeType = "image/ktx2";

    basisEncoder.delete();
  }

  self.postMessage(
    {
      jobId,
      data: outBuffer,
      mimeType: outMimeType,
    },
    [outBuffer.buffer] as any
  );

  const elapsed = performance.now() - start;

  console.log(
    `"${name}" finished in ${(elapsed / 1000).toFixed(1)} sec.\nFinal size: ${(outBuffer.byteLength / 1000000).toFixed(
      2
    )}MB`
  );

  processingJob = false;

  if (jobs.length > 0) {
    processJob().catch(console.error);
  }
}

main().catch(console.error);
