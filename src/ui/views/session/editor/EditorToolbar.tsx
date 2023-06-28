import { ReactNode, useMemo, useState } from "react";
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
import LanguageIC from "../../../../../res/ic/language.svg";
import ActivityZoneIC from "../../../../../res/ic/activity-zone.svg";
import MyLocationIC from "../../../../../res/ic/my-location.svg";
import FilterCenterFocusIC from "../../../../../res/ic/filter-center-focus.svg";
import BorderBottomIC from "../../../../../res/ic/border-bottom.svg";
import MagnetIC from "../../../../../res/ic/magnet.svg";
import Grid4x4IC from "../../../../../res/ic/grid4x4.svg";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Label } from "../../../atoms/text/Label";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { NumericInput } from "../../../atoms/input/NumericInput";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

export enum TransformMode {
  Grab = "grab",
  Translate = "translate",
  Rotate = "rotate",
  Scale = "scale",
}

export enum TransformOrientation {
  Global = "global",
  Selection = "selection",
}

export enum TransformPivot {
  ActiveSelection = "active-selection",
  SelectionCenter = "selection-center",
  SelectionBottom = "selection-bottom",
}

interface IMenuItem<T extends string> {
  id: T;
  title: string;
  icon: string;
  disabled?: boolean;
  disableReason?: string;
}

const useEditorModeMenu = (): IMenuItem<EditorMode>[] => {
  const [sceneEditor] = useLocalStorage("feature_sceneEditor", false);

  return useMemo(
    () => [
      {
        id: EditorMode.SceneInspector,
        title: "Scene Inspector",
        icon: Box3dIC,
      },
      {
        id: EditorMode.SceneEditor,
        title: "Scene Editor",
        icon: Box3dIC,
        disabled: !sceneEditor,
        disableReason: "Coming soon!",
      },
      {
        id: EditorMode.ScriptEditor,
        title: "Script Editor",
        icon: CurlyBracketIC,
      },
    ],
    [sceneEditor]
  );
};

const useTransformModeMenu = (): IMenuItem<TransformMode>[] =>
  useMemo(
    () => [
      {
        id: TransformMode.Grab,
        title: "Grab",
        icon: BackHandIC,
      },
      {
        id: TransformMode.Translate,
        title: "Translate",
        icon: OpenWithIC,
      },
      {
        id: TransformMode.Rotate,
        title: "Rotate",
        icon: AutoRenewIC,
      },
      {
        id: TransformMode.Scale,
        title: "Scale",
        icon: ResizeIC,
      },
    ],
    []
  );

const useTransformOrientationMenu = (): IMenuItem<TransformOrientation>[] =>
  useMemo(
    () => [
      {
        id: TransformOrientation.Global,
        title: "Global",
        icon: LanguageIC,
      },
      {
        id: TransformOrientation.Selection,
        title: "Selection",
        icon: ActivityZoneIC,
      },
    ],
    []
  );

const useTransformPivotMenu = (): IMenuItem<TransformPivot>[] =>
  useMemo(
    () => [
      {
        id: TransformPivot.ActiveSelection,
        title: "Active Selection",
        icon: MyLocationIC,
      },
      {
        id: TransformPivot.SelectionCenter,
        title: "Selection Center",
        icon: FilterCenterFocusIC,
      },
      {
        id: TransformPivot.SelectionBottom,
        title: "Selection Bottom",
        icon: BorderBottomIC,
      },
    ],
    []
  );

type SwitcherMenuProps<T extends string> = {
  label: string;
  selected: T;
  onSelect: (id: T) => void;
  menu: IMenuItem<T>[];
  children: ReactNode;
};
export function SwitcherMenu<T extends string>({ label, selected, onSelect, menu, children }: SwitcherMenuProps<T>) {
  return (
    <DropdownMenu
      align="start"
      style={{ padding: "var(--sp-xxs) 0" }}
      content={
        <>
          <Label style={{ padding: "var(--sp-xxs) var(--sp-sm)" }}>{label}</Label>
          {menu.map((menuItem) => {
            const itemComp = (
              <DropdownMenuItem
                key={menuItem.id}
                className="gap-xs"
                variant={menuItem.id === selected ? "primary" : "surface"}
                onSelect={() => onSelect(menuItem.id)}
                before={<Icon color={menuItem.id === selected ? "primary" : "surface"} src={menuItem.icon} />}
                disabled={menuItem.disabled}
              >
                {menuItem.title}
              </DropdownMenuItem>
            );

            if (menuItem.disabled && menuItem.disableReason)
              return (
                <Tooltip key={menuItem.id} side="right" content={menuItem.disableReason}>
                  {itemComp}
                </Tooltip>
              );
            return itemComp;
          })}
        </>
      }
    >
      {children}
    </DropdownMenu>
  );
}

export function EditorModeSwitcher() {
  const [editorMode, setEditorMode] = useAtom(editorModeAtom);
  const editorModeMenu = useEditorModeMenu();
  const activeMenuItem = editorModeMenu.find((i) => i.id === editorMode);

  return (
    <>
      {activeMenuItem && (
        <SwitcherMenu label="Editor Mode" selected={editorMode} onSelect={setEditorMode} menu={editorModeMenu}>
          <ToolbarButton
            before={<Icon size="sm" src={activeMenuItem.icon} />}
            after={<Icon size="sm" src={ChevronBottomIC} />}
            outlined
          >
            {activeMenuItem.title}
          </ToolbarButton>
        </SwitcherMenu>
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
        <div key={menuItem.id} className="inline-flex">
          {index !== 0 && <ToolbarButtonDivider />}
          <Tooltip side="bottom" content={menuItem.title}>
            <ToolbarButton active={selectedMode === menuItem.id} onClick={() => setSelectedMode(menuItem.id)}>
              <Icon size="sm" src={menuItem.icon} color={selectedMode === menuItem.id ? "primary" : "surface"} />
            </ToolbarButton>
          </Tooltip>
        </div>
      ))}
    </ToolbarButtonGroup>
  );
}

export function TransformOrientationSwitcher() {
  const [selected, setSelected] = useState(TransformOrientation.Global);
  const transformOrientationMenu = useTransformOrientationMenu();

  const activeMenuItem = transformOrientationMenu.find((item) => item.id === selected);

  return (
    <>
      {activeMenuItem && (
        <SwitcherMenu
          label="Transform Orientation"
          selected={selected}
          onSelect={setSelected}
          menu={transformOrientationMenu}
        >
          <ToolbarButton
            before={<Icon size="sm" src={activeMenuItem.icon} />}
            after={<Icon size="sm" src={ChevronBottomIC} />}
            outlined
          >
            {activeMenuItem.title}
          </ToolbarButton>
        </SwitcherMenu>
      )}
    </>
  );
}

export function TransformPivotSwitcher() {
  const [selected, setSelected] = useState(TransformPivot.ActiveSelection);
  const transformPivotMenu = useTransformPivotMenu();

  const activeMenuItem = transformPivotMenu.find((item) => item.id === selected);

  return (
    <>
      {activeMenuItem && (
        <SwitcherMenu label="Transform Pivot" selected={selected} onSelect={setSelected} menu={transformPivotMenu}>
          <ToolbarButton
            before={<Icon size="sm" src={activeMenuItem.icon} />}
            after={<Icon size="sm" src={ChevronBottomIC} />}
            outlined
          >
            {activeMenuItem.title}
          </ToolbarButton>
        </SwitcherMenu>
      )}
    </>
  );
}

export function TransformSnapping() {
  const [snap, setSnap] = useState(false);
  const [translateSnap, setTranslateSnap] = useState(1);
  const [rotateSnap, setRotateSnap] = useState(1);
  const [scaleSnap, setScaleSnap] = useState(1);

  return (
    <ToolbarButtonGroup>
      <Tooltip side="bottom" content="Toggle Snapping">
        <ToolbarButton active={snap} onClick={() => setSnap(!snap)}>
          <Icon size="sm" src={MagnetIC} color={snap ? "primary" : "surface"} />
        </ToolbarButton>
      </Tooltip>
      <ToolbarButtonDivider />

      <DropdownMenu
        align="start"
        style={{ padding: "var(--sp-xxs) 0" }}
        content={
          <div className="flex flex-column gap-sm" style={{ padding: "var(--sp-xs) var(--sp-sm)", width: "200px" }}>
            <SettingTile label={<Label>Translate Snapping</Label>}>
              <NumericInput
                type="f32"
                inputSize="sm"
                value={translateSnap}
                onChange={setTranslateSnap}
                min={0}
                smStep={5}
                lgStep={25}
                after={
                  <Text variant="b3" color="surface-low">
                    m
                  </Text>
                }
              />
            </SettingTile>
            <SettingTile label={<Label>Rotate Snapping</Label>}>
              <NumericInput
                inputSize="sm"
                value={rotateSnap}
                onChange={setRotateSnap}
                min={0}
                max={360}
                smStep={5}
                lgStep={25}
                after={
                  <Text variant="b3" color="surface-low">
                    deg
                  </Text>
                }
              />
            </SettingTile>
            <SettingTile label={<Label>Scale Snapping</Label>}>
              <NumericInput
                type="f32"
                inputSize="sm"
                value={scaleSnap}
                onChange={setScaleSnap}
                min={0}
                smStep={5}
                lgStep={25}
                after={
                  <Text variant="b3" color="surface-low">
                    m
                  </Text>
                }
              />
            </SettingTile>
          </div>
        }
      >
        <ToolbarButton>
          <Icon size="sm" src={ChevronBottomIC} />
        </ToolbarButton>
      </DropdownMenu>
    </ToolbarButtonGroup>
  );
}

export function GridToggle() {
  const [grid, setGrid] = useState(false);
  return (
    <Tooltip side="bottom" content="Toggle Grid">
      <ToolbarButton active={grid} onClick={() => setGrid(!grid)} outlined>
        <Icon size="sm" src={Grid4x4IC} color={grid ? "primary" : "surface"} />
      </ToolbarButton>
    </Tooltip>
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
          {editorMode === EditorMode.SceneEditor && (
            <ToolbarItemGroup>
              <TransformOrientationSwitcher />
              <TransformPivotSwitcher />
              <TransformSnapping />
              <GridToggle />
            </ToolbarItemGroup>
          )}
        </>
      }
      right={
        <ToolbarItemGroup>
          <EditorCmdK />
        </ToolbarItemGroup>
      }
    />
  );
}
