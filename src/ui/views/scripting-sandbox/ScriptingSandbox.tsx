import { useEffect } from "react";

import scriptingRuntimeWASMUrl from "../../../scripting/build/scripting-runtime.wasm?url";
import ScriptingRuntimeModule from "../../../scripting/build/scripting-runtime";

export default function ScriptingSandbox() {
  useEffect(() => {
    async function run() {
      const ScriptingRuntime = await ScriptingRuntimeModule({
        locateFile(path: string) {
          if (path.endsWith(".wasm")) {
            return scriptingRuntimeWASMUrl;
          }
        },
      });

      console.log(ScriptingRuntime._runJS());
    }

    run().catch(console.error);
  }, []);

  return <div />;
}
