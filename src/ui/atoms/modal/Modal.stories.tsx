import { Modal } from "./Modal";
import { ModalContent } from "./ModalContent";
import { ModalAside } from "./ModalAside";
import { Button } from "../button/Button";

export const title = "Modal";

export default function ModalStories() {
  return (
    <div>
      <Modal trigger={<Button>Open modal</Button>}>
        <ModalContent aside={<ModalAside>Hello world</ModalAside>}>Hello, World!</ModalContent>
      </Modal>
    </div>
  );
}
