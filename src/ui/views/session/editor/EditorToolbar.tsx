import { useMemo, useState } from "react";
import { useKBar } from "kbar";
import { useAtom, useAtomValue } from "jotai";

import { Toolbar, ToolbarItemGroup } from "../../components/editor-toolbar/Toolbar";
import { ToolbarButton, ToolbarButtonDivider, ToolbarButtonGroup } from "../../components/editor-toolbar/ToolbarButton";
import { Text } from "../../../atoms/text/Text";
import { EditorMode, editorModeAtom } from "../../../state/editor";
import { Icon } from "../../../atoms/icon/Icon";
import SearchIC from "../../../../../res/ic/search.svg";
import CurlyBracketIC from "../../../../../res/ic/curly-bracket.svg";
import Box3dIC from "../../../../../res/ic/box-3d.svg";
import ChevronBottomIC from "../../../../../res/ic/chevron-bottom.svg";
import BackHandIC from "../../../../../res/ic/back-hand.svg";
import OpenWithIC from "../../../../../res/ic/open-with.svg";
import AutoRenewIC from "../../../../../res/ic/auto-renew.svg";
import ResizeIC from "../../../../../res/ic/resize.svg";
import WebAssetIC from "../../../../../res/ic/web-asset.svg";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Label } from "../../../atoms/text/Label";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";

interface IEditorMode {
  mode: EditorMode;
  title: string;
  icon: string;
}

const useEditorModeMenu = (): IEditorMode[] =>
  useMemo(
    () => [
      {
        mode: EditorMode.SceneEditor,
        title: "Scene Editor",
        icon: Box3dIC,
      },
      {
        mode: EditorMode.ScriptEditor,
        title: "Script Editor",
        icon: CurlyBracketIC,
      },
    ],
    []
  );

export enum TransformMode {
  Grab = "grab",
  Translate = "translate",
  Rotate = "rotate",
  Scale = "scale",
}

interface ITransformMode {
  mode: TransformMode;
  title: string;
  icon: string;
}
const useTransformModeMenu = (): ITransformMode[] =>
  useMemo(
    () => [
      {
        mode: TransformMode.Grab,
        title: "Grab",
        icon: BackHandIC,
      },
      {
        mode: TransformMode.Translate,
        title: "Translate",
        icon: OpenWithIC,
      },
      {
        mode: TransformMode.Rotate,
        title: "Rotate",
        icon: AutoRenewIC,
      },
      {
        mode: TransformMode.Scale,
        title: "Scale",
        icon: ResizeIC,
      },
    ],
    []
  );

export function EditorModeSwitcher() {
  const [editorMode, setEditorMode] = useAtom(editorModeAtom);
  const editorModeMenu = useEditorModeMenu();
  const activeMenuItem = editorModeMenu.find((i) => i.mode === editorMode);

  return (
    <>
      {activeMenuItem && (
        <DropdownMenu
          align="start"
          style={{ padding: "var(--sp-xxs) 0" }}
          content={
            <>
              <Label style={{ padding: "var(--sp-xxs) var(--sp-sm)" }}>Editor Modes</Label>
              {editorModeMenu.map((menuItem) => (
                <DropdownMenuItem
                  key={menuItem.mode}
                  className="gap-xs"
                  variant={menuItem.mode === editorMode ? "primary" : "surface"}
                  onSelect={() => setEditorMode(menuItem.mode)}
                  before={<Icon color={menuItem.mode === editorMode ? "primary" : "surface"} src={menuItem.icon} />}
                >
                  {menuItem.title}
                </DropdownMenuItem>
              ))}
            </>
          }
        >
          <ToolbarButton
            before={<Icon size="sm" src={activeMenuItem.icon} />}
            after={<Icon size="sm" src={ChevronBottomIC} />}
            outlined
          >
            {activeMenuItem.title}
          </ToolbarButton>
        </DropdownMenu>
      )}
    </>
  );
}

export function TransformModeSwitcher() {
  const [selectedMode, setSelectedMode] = useState(TransformMode.Grab);
  const transformModeMenu = useTransformModeMenu();

  return (
    <ToolbarButtonGroup>
      {transformModeMenu.map((menuItem, index) => (
        <div key={menuItem.mode} className="inline-flex">
          {index !== 0 && <ToolbarButtonDivider />}
          <Tooltip side="bottom" content={menuItem.title}>
            <ToolbarButton active={selectedMode === menuItem.mode} onClick={() => setSelectedMode(menuItem.mode)}>
              <Icon size="sm" src={menuItem.icon} color={selectedMode === menuItem.mode ? "primary" : "surface"} />
            </ToolbarButton>
          </Tooltip>
        </div>
      ))}
    </ToolbarButtonGroup>
  );
}

export function EditorCmdK() {
  const kBar = useKBar();

  return (
    <ToolbarButton
      before={<Icon size="sm" color="surface-low" src={SearchIC} />}
      outlined
      onClick={() => kBar.query.toggle()}
    >
      <Text variant="b3" weight="semi-bold" color="surface-low">
        ⌘ + K
      </Text>
    </ToolbarButton>
  );
}

export function EditorToolbar() {
  const editorMode = useAtomValue(editorModeAtom);

  return (
    <Toolbar
      left={
        <>
          <ToolbarItemGroup>
            <EditorModeSwitcher />
          </ToolbarItemGroup>
          {editorMode === EditorMode.SceneEditor && (
            <ToolbarItemGroup>
              <TransformModeSwitcher />
            </ToolbarItemGroup>
          )}
        </>
      }
      right={
        <ToolbarItemGroup>
          {editorMode === EditorMode.SceneEditor && (
            <ToolbarButton before={<Icon src={WebAssetIC} size="sm" />} outlined>
              Asset Panel
            </ToolbarButton>
          )}
          <EditorCmdK />
        </ToolbarItemGroup>
      }
    />
  );
}
