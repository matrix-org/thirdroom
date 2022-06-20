export type PromiseObjectResult<T extends { [Prop in keyof T]: Promise<T[Prop]> | undefined }> = {
  [Prop in keyof T]: Awaited<T[Prop]>;
};

export async function promiseObject<T extends { [key: string]: any }>(obj: T): Promise<PromiseObjectResult<T>> {
  const keys = Object.keys(obj);
  const promises = Object.values(obj);
  const results = await Promise.all(promises);

  const value: { [key: string]: any } = {};

  for (let i = 0; i < results.length; i++) {
    value[keys[i]] = results[i];
  }

  return value as PromiseObjectResult<T>;
}
