import { useKBar } from "kbar";
import { useAtom } from "jotai";

import { Toolbar, ToolbarItemGroup } from "../../components/editor-toolbar/Toolbar";
import { ToolbarButton } from "../../components/editor-toolbar/ToolbarButton";
import { Text } from "../../../atoms/text/Text";
import { EditorMode, editorModeAtom } from "../../../state/editor";
import { Icon } from "../../../atoms/icon/Icon";
import SearchIC from "../../../../../res/ic/search.svg";
import CurlyBracketIC from "../../../../../res/ic/curly-bracket.svg";
import Box3dIC from "../../../../../res/ic/box-3d.svg";
import ChevronBottomIC from "../../../../../res/ic/chevron-bottom.svg";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Label } from "../../../atoms/text/Label";

interface IEditorMode {
  mode: EditorMode;
  title: string;
  icon: string;
}

const useEditorModeMenu = (): IEditorMode[] => [
  {
    mode: EditorMode.NodeEditor,
    title: "Node Editor",
    icon: Box3dIC,
  },
  {
    mode: EditorMode.ScriptEditor,
    title: "Script Editor",
    icon: CurlyBracketIC,
  },
];

export function EditorToolbar() {
  const kBar = useKBar();
  const [editorMode, setEditorMode] = useAtom(editorModeAtom);

  const editorModeMenu = useEditorModeMenu();
  const activeMenuItem = editorModeMenu.find((i) => i.mode === editorMode);

  return (
    <Toolbar>
      <ToolbarItemGroup>
        {activeMenuItem && (
          <DropdownMenu
            align="start"
            style={{ padding: "var(--sp-xxs) 0" }}
            content={
              <>
                <Label style={{ padding: "var(--sp-xxs) var(--sp-sm)" }}>Editor Modes</Label>
                {editorModeMenu.map((menuItem) => (
                  <DropdownMenuItem
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
      </ToolbarItemGroup>
      <ToolbarItemGroup className="grow justify-end">
        <ToolbarButton
          before={<Icon size="sm" color="surface-low" src={SearchIC} />}
          outlined
          onClick={() => kBar.query.toggle()}
        >
          <Text variant="b3" weight="semi-bold" color="surface-low">
            ⌘ + K
          </Text>
        </ToolbarButton>
      </ToolbarItemGroup>
    </Toolbar>
  );
}
