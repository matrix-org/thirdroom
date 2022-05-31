export function registerThirdroomGlobalFn(key: string, fn: (...args: any[]) => any) {
  const global = window as unknown as any;

  if (!global.thirdroom) {
    global.thirdroom = {};
  }

  global.thirdroom[key] = fn;

  return () => {
    if (global.thirdroom) {
      global.thirdroom[key] = () => {};
    }
  };
}

export function registerThirdroomGlobalVar(key: string, value: any) {
  const global = window as unknown as any;

  if (!global.thirdroom) {
    global.thirdroom = {};
  }

  global.thirdroom[key] = value;

  return () => {
    if (global.thirdroom) {
      global.thirdroom[key] = undefined;
    }
  };
}
