import { useCallback } from "react";
import classNames from "classnames";
import { TreeView, NodeDropPosition } from "@thirdroom/manifold-editor-components";

import "./HierarchyPanel.css";
import { EditorNode } from "../../../../engine/editor/editor.common";

enum DnDItemTypes {
  Node = "node",
}

const dragItemType = DnDItemTypes.Node;
const dropAccept = [DnDItemTypes.Node];

interface DnDItem {
  type: DnDItemTypes;
  nodeIds?: number[];
}

function getSelectionRoots(scene: EditorNode, selection: number[]): EditorNode[] {
  const roots: EditorNode[] = [];

  const traverse = (object: EditorNode) => {
    if (selection.includes(object.id)) {
      roots.push(object);
      return;
    }

    for (const child of object.children) {
      traverse(child);
    }
  };

  traverse(scene);

  return roots;
}

function findEntityById(node: EditorNode, eid: number): EditorNode | undefined {
  if (node.eid === eid) {
    return node;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    const found = findEntityById(child, eid);

    if (found) {
      return found;
    }
  }

  return undefined;
}

interface HierarchyPanelProps {
  scene: EditorNode;
}

const selected: number[] = [];
const active = undefined;

export function HierarchyPanel({ scene }: HierarchyPanelProps) {
  const canDrop = useCallback(
    (item: DnDItem, target: number | undefined, position: NodeDropPosition) => {
      if (!item.nodeIds) {
        return false;
      }

      if (target === undefined) {
        return position === NodeDropPosition.Root;
      }

      if (target === scene.eid && (position === NodeDropPosition.Before || position === NodeDropPosition.After)) {
        return false;
      }

      const roots = getSelectionRoots(scene, item.nodeIds);

      for (const root of roots) {
        if (findEntityById(root, target) !== undefined) {
          return false;
        }
      }

      return true;
    },
    [scene]
  );

  const canDrag = useCallback(
    (nodeId: number) => {
      return !selected.includes(scene.id);
    },
    [scene]
  );

  const getDragItem = useCallback((nodeId: number) => {
    return { type: DnDItemTypes.Node, nodeIds: selected };
  }, []);

  const onToggleSelectedNode = useCallback((nodeId) => {}, []);

  const onAddSelectedNode = useCallback((nodeId) => {}, []);

  const onSetSelectedNode = useCallback((nodeId) => {}, []);

  const onDoubleClickNode = useCallback((nodeId) => {
    console.log(`Focus ${nodeId}`);
  }, []);

  const onRenameNode = useCallback((nodeId, name) => {}, []);

  const onDrop = useCallback((item: DnDItem, target: number | undefined, position: NodeDropPosition) => {}, []);

  return (
    <div className="HierarchyPanel">
      <TreeView
        tree={scene}
        selected={selected}
        active={active}
        itemSize={32}
        onToggleSelectedNode={onToggleSelectedNode}
        onAddSelectedNode={onAddSelectedNode}
        onSetSelectedNode={onSetSelectedNode}
        onDoubleClickNode={onDoubleClickNode}
        onRenameNode={onRenameNode}
        dropAccept={dropAccept}
        onDrop={onDrop}
        canDrop={canDrop}
        dragItemType={dragItemType}
        canDrag={canDrag}
        getDragItem={getDragItem}
      >
        {({
          id,
          name,
          depth,
          isExpanded,
          isSelected,
          isActive,
          isLeaf,
          isRenaming,
          listItemProps,
          dragContainerProps,
          beforeDropTargetState,
          beforeDropTargetRef,
          afterDropTargetState,
          afterDropTargetRef,
          onDropTargetState,
          onDropTargetRef,
          toggleProps,
          nameInputProps,
        }) => {
          return (
            <li {...listItemProps}>
              <div
                {...dragContainerProps}
                className={classNames("HierarchyPanel__node", {
                  "HierarchyPanel__node--root": depth === 0,
                  "HierarchyPanel__node--selected": isSelected,
                  "HierarchyPanel__node--active": isActive,
                })}
              >
                <div
                  ref={beforeDropTargetRef}
                  className={classNames("HierarchyPanel__drop-target", "HierarchyPanel__drop-target--before", {
                    "HierarchyPanel__drop-target--accept":
                      beforeDropTargetState.canDrop && beforeDropTargetState.isOver,
                  })}
                />
                <div
                  ref={onDropTargetRef}
                  className="HierarchyPanel__node-content"
                  style={{ paddingLeft: depth * 8 + 2 }}
                >
                  {isLeaf ? (
                    <div className="HierarchyPanel__leaf-spacer" />
                  ) : (
                    <button
                      {...toggleProps}
                      className={classNames("HierarchyPanel__node-toggle", {
                        "HierarchyPanel__node-toggle--expanded": isExpanded,
                      })}
                    />
                  )}
                  <div className="HierarchyPanel__node-select-target">
                    <div className="HierarchyPanel__node-icon" />
                    <div className="HierarchyPanel__node-label-container">
                      {isRenaming ? (
                        <div className="HierarchyPanel__rename-input-container">
                          <input {...nameInputProps} className="HierarchyPanel__rename-input" />
                        </div>
                      ) : (
                        <div
                          className={classNames("HierarchyPanel__node-label", {
                            "HierarchyPanel__node-label--accept-drop":
                              onDropTargetState.canDrop && onDropTargetState.isOver,
                          })}
                        >
                          {name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  ref={afterDropTargetRef}
                  className={classNames("HierarchyPanel__drop-target", "HierarchyPanel__drop-target--after", {
                    "HierarchyPanel__drop-target--accept": afterDropTargetState.canDrop && afterDropTargetState.isOver,
                  })}
                />
              </div>
            </li>
          );
        }}
      </TreeView>
    </div>
  );
}
