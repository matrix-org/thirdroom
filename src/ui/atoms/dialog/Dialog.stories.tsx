import { Meta } from "@storybook/react";

import { Dialog } from "./Dialog";
import { Button } from "../button/Button";
import { Header } from "../header/Header";
import { HeaderTitle } from "../header/HeaderTitle";

export default {
  title: "Dialog",
  component: Dialog,
} as Meta<typeof Dialog>;

export function DialogStories() {
  return (
    <Dialog trigger={<Button>Open Dialog</Button>}>
      <Header left={<HeaderTitle size="lg">Dialog</HeaderTitle>} />
      <div style={{ height: "200px" }} />
    </Dialog>
  );
}
