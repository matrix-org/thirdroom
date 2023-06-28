import { Meta } from "@storybook/react";

import { Modal } from "./Modal";
import { ModalContent } from "./ModalContent";
import { ModalAside } from "./ModalAside";
import { Button } from "../button/Button";

export default {
  title: "Modal",
  component: Modal,
} as Meta<typeof Modal>;

export function ModalStories() {
  return (
    <div>
      <Modal trigger={<Button>Open modal</Button>}>
        <ModalContent aside={<ModalAside>Hello world</ModalAside>}>Hello, World!</ModalContent>
      </Modal>
    </div>
  );
}
