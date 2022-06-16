// MIT Licensed
// Copyright © 2010-2022 three.js authors
// Source: https://github.com/mrdoob/three.js/blob/00d3363e2d8a6d43dfdb75e50e3ff553b3c2f932/src/loaders/LoaderUtils.js#L3

export default function resolveURL(url: string, path: string) {
  // Invalid URL
  if (typeof url !== "string" || url === "") return "";

  // Host Relative URL
  if (/^https?:\/\//i.test(path) && /^\//.test(url)) {
    path = path.replace(/(^https?:\/\/[^/]+).*/i, "$1");
  }

  // Absolute URL http://,https://,//
  if (/^(https?:)?\/\//i.test(url)) return url;

  // Data URI
  if (/^data:.*,.*$/i.test(url)) return url;

  // Blob URL
  if (/^blob:.*$/i.test(url)) return url;

  // Relative URL
  return path + url;
}
