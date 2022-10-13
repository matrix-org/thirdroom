import { useEffect } from "react";

import { useIsMounted } from "../../hooks/useIsMounted";
import { ScriptingRuntime } from "./ScriptingRuntime";

export default function ScriptingSandbox() {
  const isMounted = useIsMounted();

  useEffect(() => {
    let runtime: ScriptingRuntime;

    async function run() {
      const code = `
        const cubeNode = createNode({
          translation: [0, 1, 0],
          mesh: createMesh({
            primitives: [
              createCubePrimitive({
                size: [1, 1, 1],
                material: createPBRMaterial({
                  baseColorFactor: [1, 0, 0, 1]
                })
              })
            ]
          })
        });

        setParent(scene, cubeNode);

        onUpdate = (dt) => {
          transformRotateY(id, dt * 0.5);
        };
      `;

      runtime = await ScriptingRuntime.load(code);
    }

    run()
      .then(() => {
        if (!isMounted()) {
          runtime.dispose();
        }
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted()) {
          runtime.dispose();
        }
      });

    return () => {
      if (runtime) {
        runtime.dispose();
      }
    };
  }, [isMounted]);

  return <div />;
}
