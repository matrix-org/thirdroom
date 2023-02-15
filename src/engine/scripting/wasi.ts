import { WASMModuleContext } from "./WASMModuleContext";

export function createWASIModule({ U32Heap, U8Heap, textDecoder }: WASMModuleContext) {
  return {
    environ_sizes_get: () => {
      return 0;
    },
    environ_get: () => {
      return 0;
    },
    clock_time_get: (a: number, b: number, ptime: number) => {
      const now = Date.now();
      // "now" is in ms, and wasi times are in ns.
      const nsec = Math.round(now * 1000 * 1000);
      U32Heap[ptime >> 2] = nsec >>> 0;
      U32Heap[(ptime + 4) >> 2] = (nsec / Math.pow(2, 32)) >>> 0;
      return 0;
    },
    fd_seek: () => {
      return 70;
    },
    fd_write: (fd: number, iov: number, iovcnt: number, pnum: number) => {
      const out: string[] = [];
      let num = 0;
      for (let i = 0; i < iovcnt; i++) {
        const iovPtr = iov + i * 8;
        const ptr = U32Heap[iovPtr >> 2];
        const len = U32Heap[(iovPtr + 4) >> 2];
        const str = textDecoder.decode(U8Heap.slice(ptr, ptr + len));
        out.push(str);

        num += len;
      }
      U32Heap[pnum >> 2] = num;

      if (fd === 1) {
        console.log(...out);
      } else {
        console.error(...out);
      }

      return 0;
    },
    fd_close: () => {
      return 0;
    },
    proc_exit: (code: number) => {
      throw new Error(`exit(${code})`);
    },
  };
}
