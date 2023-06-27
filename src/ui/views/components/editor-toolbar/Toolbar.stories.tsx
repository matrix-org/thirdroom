import { Meta } from "@storybook/react";

import { Icon } from "../../../atoms/icon/Icon";
import { ToolbarButton, ToolbarButtonGroup, ToolbarButtonDivider } from "./ToolbarButton";
import ExploreIC from "../../../../../res/ic/explore.svg";
import ChevronBottomIC from "../../../../../res/ic/chevron-bottom.svg";
import MenuIC from "../../../../../res/ic/menu.svg";
import { Toolbar, ToolbarItemGroup } from "./Toolbar";

export default {
  title: "Toolbar",
  component: Toolbar,
} as Meta<typeof Toolbar>;

export function ToolbarStories() {
  return (
    <div style={{ padding: "var(--sp-md)", backgroundColor: "var(--bg-surface)" }}>
      <Toolbar
        left={
          <ToolbarItemGroup>
            <ToolbarButton>
              <Icon size="sm" src={MenuIC} />
            </ToolbarButton>

            <ToolbarButton outlined>Toolbar Button</ToolbarButton>

            <ToolbarButton before={<Icon size="sm" src={ExploreIC} />} outlined>
              Toolbar Button
            </ToolbarButton>
          </ToolbarItemGroup>
        }
        center={
          <ToolbarItemGroup>
            <ToolbarButton outlined>
              <Icon size="sm" src={ExploreIC} />
            </ToolbarButton>

            <ToolbarButtonGroup>
              <ToolbarButton active={true}>
                <Icon color="primary" size="sm" src={ExploreIC} />
              </ToolbarButton>
              <ToolbarButtonDivider />
              <ToolbarButton>
                <Icon size="sm" src={ChevronBottomIC} />
              </ToolbarButton>
            </ToolbarButtonGroup>
          </ToolbarItemGroup>
        }
        right={
          <ToolbarItemGroup>
            <ToolbarButton
              before={<Icon size="sm" src={ExploreIC} />}
              after={<Icon size="sm" src={ExploreIC} />}
              outlined
            >
              Toolbar Button
            </ToolbarButton>
          </ToolbarItemGroup>
        }
      />
    </div>
  );
}
