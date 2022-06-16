export function removeUndefinedProperties<T>(obj: T): T {
  for (const key in obj) {
    if ((obj[key] as any) === undefined) delete obj[key];
  }
  return obj as T;
}
