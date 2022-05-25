import { DropdownMenu } from "./DropdownMenu";
import { DropdownMenuItem } from "./DropdownMenuItem";
import { Button } from "../button/Button";

export const title = "DropdownMenu";

export default function DropdownMenuStories() {
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
