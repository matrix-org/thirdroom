import { Meta } from "@storybook/react";

import { DropdownMenu } from "./DropdownMenu";
import { DropdownMenuItem } from "./DropdownMenuItem";
import { Button } from "../button/Button";

export default {
  title: "DropdownMenu",
  component: DropdownMenu,
} as Meta<typeof DropdownMenu>;

export function DropdownMenuStories() {
  return (
    <div>
      <DropdownMenu
        content={
          <>
            <DropdownMenuItem>Hello, World</DropdownMenuItem>
            <DropdownMenuItem>Hello, World</DropdownMenuItem>
          </>
        }
      >
        <Button>Dropdown</Button>
      </DropdownMenu>
      <DropdownMenu
        content={
          <>
            <DropdownMenuItem>Hello, World</DropdownMenuItem>
            <DropdownMenuItem variant="danger">Hello, World</DropdownMenuItem>
          </>
        }
        side="right"
      >
        <Button>Dropdown</Button>
      </DropdownMenu>
    </div>
  );
}
