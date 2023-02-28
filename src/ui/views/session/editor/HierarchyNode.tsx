import { KeyboardEventHandler, MouseEventHandler, ReactNode, Ref } from "react";
import classNames from "classnames";

import "./HierarchyNode.css";

export function HierarchyNode({
  depth,
  selected,
  active,
  nodeRef,
  onMouseDown,
  onKeyDown,
  tabIndex,
  children,
}: {
  depth: number;
  selected: boolean;
  active: boolean;
  nodeRef: Ref<HTMLDivElement>;
  onMouseDown: MouseEventHandler<Element>;
  onKeyDown: KeyboardEventHandler<Element>;
  tabIndex: number;
  children: ReactNode;
}) {
  return (
    <div
      ref={nodeRef}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      className={classNames("HierarchyNode", {
        "HierarchyNode--root": depth === 0,
        "HierarchyNode--selected": selected,
        "HierarchyNode--active": active,
      })}
      style={{
        paddingLeft: depth * 15, // 15 is css var(--sp-sm)
      }}
    >
      {children}
    </div>
  );
}

export function HierarchyNodeDropTarget({
  placement,
  dropTargetRef,
  canDrop,
  isOver,
}: {
  placement: "before" | "after";
  dropTargetRef: Ref<HTMLDivElement>;
  canDrop: boolean;
  isOver: boolean;
}) {
  return (
    <div
      ref={dropTargetRef}
      className={classNames(
        "HierarchyNodeDropTarget",
        {
          "HierarchyNodeDropTarget--acceptDrop": canDrop && isOver,
        },
        `HierarchyNodeDropTarget--${placement}`
      )}
    />
  );
}

export function HierarchyNodeContent({
  className,
  dropTargetRef,
  canDrop,
  isOver,
  children,
}: {
  className?: string;
  dropTargetRef: Ref<HTMLDivElement>;
  canDrop: boolean;
  isOver: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "HierarchyNodeContent",
        {
          "HierarchyNodeContent--acceptDrop": isOver && canDrop,
        },
        className
      )}
      ref={dropTargetRef}
    >
      {children}
    </div>
  );
}

export function HierarchyNodeLeafSpacer() {
  return <span className="shrink-0" style={{ width: "var(--sp-sm)" }} />;
}
