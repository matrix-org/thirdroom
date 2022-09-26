export enum MissingFeature {
  SHARED_ARRAY_BUFFER = "SHARED_ARRAY_BUFFER",
  MIN_FIREFOX_VERSION = "MIN_FIREFOX_VERSION",
  WEB_GL2 = "WEB_GL2",
  WEB_GL_HARDWARE_ACC = "WEB_GL_HARDWARE_ACC",
  WEB_RTC = "WEB_RTC",
  INDEXED_DB = "INDEXED_DB",
}

export const SUPPORTED_FIREFOX_VERSION = 104;

function sharedArrayBufferSupport() {
  return typeof window.SharedArrayBuffer === "function";
}

function firefoxBrowser() {
  return navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
}

export function getFirefoxVersion() {
  const matches = navigator.userAgent.toLocaleLowerCase().match(/firefox\/([0-9]+\.*[0-9]*)/);
  if (matches) {
    const version = parseInt(matches[1]);
    if (typeof version === "number") return version;
  }
  return undefined;
}

function getTestCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  canvas.style.position = "fixed";
  canvas.style.opacity = "0";
  canvas.style.visibility = "hidden";
  return canvas;
}

function webGL2Support() {
  const canvas = getTestCanvas();
  document.body.append(canvas);
  const support = !!canvas.getContext("webgl2");
  document.body.removeChild(canvas);
  return support;
}

function webGLHardwareAccSupport() {
  const canvas = getTestCanvas();
  document.body.append(canvas);
  const support = !!canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  document.body.removeChild(canvas);
  return support;
}

function webRTCSupport() {
  return ["RTCPeerConnection", "webkitRTCPeerConnection", "mozRTCPeerConnection", "RTCIceGatherer"].some(
    (prop) => prop in window
  );
}

async function indexedDBSupport(): Promise<boolean> {
  const testDBName = `featureCheck-${Math.random()}`;
  return new Promise((resolve) => {
    let db;
    try {
      db = indexedDB.open(testDBName);
    } catch {
      resolve(false);
      return;
    }
    db.onsuccess = () => {
      resolve(true);
      indexedDB.deleteDatabase(testDBName);
    };
    db.onerror = () => {
      resolve(false);
      indexedDB.deleteDatabase(testDBName);
    };
  });
}

export async function getMissingFeature() {
  const missingFeature: MissingFeature[] = [];

  if (sharedArrayBufferSupport() === false) {
    missingFeature.push(MissingFeature.SHARED_ARRAY_BUFFER);
  }

  if (firefoxBrowser()) {
    const version = getFirefoxVersion();
    if (version && version < SUPPORTED_FIREFOX_VERSION) {
      missingFeature.push(MissingFeature.MIN_FIREFOX_VERSION);
    }
  }

  if (webGL2Support() === false) {
    missingFeature.push(MissingFeature.WEB_GL2);
  }

  if (webGLHardwareAccSupport() === false) {
    missingFeature.push(MissingFeature.WEB_GL_HARDWARE_ACC);
  }

  if (webRTCSupport() === false) {
    missingFeature.push(MissingFeature.WEB_RTC);
  }
  if ((await indexedDBSupport()) === false) {
    missingFeature.push(MissingFeature.INDEXED_DB);
  }

  return missingFeature;
}
