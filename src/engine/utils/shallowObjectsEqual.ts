export function shallowObjectsEqual(objA: {}, objB: {}) {
  if (objA === objB) return true;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!(keysA[i] in objB)) {
      return false;
    }
  }

  for (let i = 0; i < keysA.length; i++) {
    if ((objA as any)[keysA[i]] !== (objB as any)[keysA[i]]) {
      return false;
    }
  }

  return true;
}
