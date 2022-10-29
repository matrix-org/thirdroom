import { IResourceManager, MAX_C_STRING_BYTE_LENGTH } from "./IResourceManager";

export class ScriptResourceManager implements IResourceManager {
  buffer: ArrayBuffer | SharedArrayBuffer;
  U8Heap: Uint8Array;
  U32Heap: Uint32Array;
  textDecoder: TextDecoder;
  textEncoder: TextEncoder;

  private instance?: WebAssembly.Instance;

  constructor(public memory: WebAssembly.Memory) {
    this.buffer = memory.buffer;
    this.U8Heap = new Uint8Array(this.buffer);
    this.U32Heap = new Uint32Array(this.buffer);
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
  }

  setInstance(instance: WebAssembly.Instance): void {
    this.instance = instance;
  }

  allocate(byteLength: number): number {
    return (this.instance!.exports.allocate as Function)(byteLength);
  }

  deallocate(ptr: number): void {
    (this.instance!.exports.deallocate as Function)(ptr);
  }

  allocateString(value: string): number {
    const arr = this.textEncoder.encode(value);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    nullTerminatedArr.set(arr);
    const ptr = this.allocate(nullTerminatedArr.byteLength);
    this.U8Heap.set(nullTerminatedArr, ptr);
    return ptr;
  }

  decodeString(ptr: number): string {
    if (!ptr) {
      return "";
    }

    const maxPtr = ptr + MAX_C_STRING_BYTE_LENGTH;
    let end = ptr;

    // Find the end of the null-terminated C string on the heap
    while (!(end >= maxPtr) && this.U8Heap[end]) {
      ++end;
    }

    // create a new subarray to store the string so that this always works with SharedArrayBuffer
    return this.textDecoder.decode(this.U8Heap.subarray(ptr, end));
  }

  encodeString(ptr: number, value: string): number {
    if (!ptr || !value) {
      return 0;
    }

    const strPtr = this.allocateString(value);
    this.U32Heap[ptr / Uint32Array.BYTES_PER_ELEMENT] = strPtr;
    return strPtr;
  }

  createImports(): { [key: string]: WebAssembly.ModuleImports } {
    const printCharBuffers: (number[] | null)[] = [null, [], []];

    const printChar = (stream: number, curr: number) => {
      const buffer = printCharBuffers[stream];

      if (!buffer) {
        throw new Error("buffer doesn't exist");
      }

      if (curr === 0 || curr === 10) {
        if (stream === 1) {
          console.log(this.textDecoder.decode(new Uint8Array(buffer)));
        } else {
          console.error(this.textDecoder.decode(new Uint8Array(buffer)));
        }
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };

    return {
      env: {
        memory: this.memory,
      },
      wasgi: {
        get_light_by_name: (namePtr: number) => {
          // const name = bufferManager.decodeString(namePtr);
          // const light = ctx.lights.find((light) => light.name === name);
          // return light ? light.id : -1;
          return 0;
        },
        create_light: () => {
          return 0;
        },
        dispose_light: (ptr: number) => {},
      },
      wasi_snapshot_preview1: {
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
          this.U32Heap[ptime >> 2] = nsec >>> 0;
          this.U32Heap[(ptime + 4) >> 2] = (nsec / Math.pow(2, 32)) >>> 0;
          return 0;
        },
        fd_seek: () => {
          return 70;
        },
        fd_write: (fd: number, iov: number, iovcnt: number, pnum: number) => {
          // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
          let num = 0;
          for (let i = 0; i < iovcnt; i++) {
            const ptr = this.U32Heap[iov >> 2];
            const len = this.U32Heap[(iov + 4) >> 2];
            iov += 8;
            for (let j = 0; j < len; j++) {
              printChar(fd, this.U8Heap[ptr + j]);
            }
            num += len;
          }
          this.U32Heap[pnum >> 2] = num;
          return 0;
        },
        fd_close: () => {
          return 0;
        },
        proc_exit: (code: number) => {
          throw new Error(`exit(${code})`);
        },
      },
    };
  }
}
