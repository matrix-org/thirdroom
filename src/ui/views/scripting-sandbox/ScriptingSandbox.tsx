import { useEffect } from "react";

import scriptingRuntimeWASMUrl from "../../../scripting/build/scripting-runtime.wasm?url";
import ScriptingRuntimeModule from "../../../scripting/build/scripting-runtime";

export default function ScriptingSandbox() {
  useEffect(() => {
    let runtime: any;
    let animationFrame: number;

    async function run() {
      runtime = await ScriptingRuntimeModule({
        locateFile(path: string) {
          if (path.endsWith(".wasm")) {
            return scriptingRuntimeWASMUrl;
          }
        },
      });

      const code = `
        onUpdate = () => {
          console.log("test7");
        };
      `;

      const codePtr = runtime.allocateUTF8(code);

      if (runtime._init(codePtr)) {
        return;
      }

      const update = (t: number) => {
        if (runtime._update()) {
          return;
        }

        animationFrame = requestAnimationFrame(update);
      };

      animationFrame = requestAnimationFrame(update);
    }

    run().catch((error) => {
      console.error(error);

      if (runtime) {
        try {
          runtime.exitJS(0);
        } catch {}
      }

      cancelAnimationFrame(animationFrame);
    });

    return () => {
      if (runtime) {
        try {
          runtime.exitJS(0);
        } catch {}
      }

      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <div />;
}
