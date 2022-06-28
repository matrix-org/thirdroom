import { Dialog } from "./Dialog";
import { Button } from "../button/Button";
import { Header } from "../header/Header";
import { HeaderTitle } from "../header/HeaderTitle";

export const title = "Dialog";

export default function DialogStories() {
  return (
    <Dialog trigger={<Button>Open Dialog</Button>}>
      <Header left={<HeaderTitle size="lg">Dialog</HeaderTitle>} />
      <div style={{ height: "200px" }} />
    </Dialog>
  );
}
