import { useEffect } from "react";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getModule } from "../../../../engine/module/module.common";
import { EditorModule } from "../../../../engine/editor/editor.main";
import { getLocalResource } from "../../../../engine/resource/resource.main";

export function EditorView() {
  const { loading, scene, activeEntity, selectedEntities } = useEditor();

  const mainThread = useMainThreadContext();

  useEffect(() => {
    let animationFrame: number;

    function update() {
      const editor = getModule(mainThread, EditorModule);

      console.log(getLocalResource(mainThread, editor.activeEntity));

      animationFrame = requestAnimationFrame(update);
    }

    update();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [mainThread]);

  return (
    <>
      {loading || !scene ? null : (
        <div className="EditorView_rightPanel gap-xs">
          <HierarchyPanel activeEntity={activeEntity} selectedEntities={selectedEntities} scene={scene} />
        </div>
      )}
    </>
  );
}
