import "./WhatsNewModal.css";
import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { Content } from "../../../atoms/content/Content";
import { Footer } from "../../../atoms/footer/Footer";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Modal } from "../../../atoms/modal/Modal";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { WhatsNewCard } from "./WhatsNewCard";

interface WhatsNewModalProps {
  open: boolean;
  requestClose: () => void;
  createSpecialWorld: () => void;
}

export function WhatsNewModal({ open, requestClose, createSpecialWorld }: WhatsNewModalProps) {
  return (
    <Modal open={open} className="WhatsNewModal" size="sm">
      <Content
        children={
          <div className="WhatsNewModal__content">
            <Scroll type="hover">
              <div className="WhatsNewModal__hero flex flex-column justify-center items-center gap-sm text-center">
                <Text variant="h2" weight="bold">
                  Welcome to the Third Room
                </Text>
                <Text variant="s2" weight="semi-bold">
                  Creator Update
                </Text>
              </div>
              <Category header={<CategoryHeader title={"What's New"} />}>
                <WhatsNewCard
                  thumbnail={
                    <Thumbnail size="sm" bgColor="var(--bg-surface-low)">
                      <ThumbnailImg src="/creator-update/WebSGThumbnail.jpg" />
                    </Thumbnail>
                  }
                  title="Web Scene Graph API"
                  description="Add behaviors to your worlds using the new Web Scene Graph API. Create portable interactive worlds with JavaScript and WebAssembly."
                />
                <WhatsNewCard
                  thumbnail={
                    <Thumbnail size="sm" bgColor="var(--bg-surface-low)">
                      <ThumbnailImg src="/creator-update/WebXRThumbnail.jpg" />
                    </Thumbnail>
                  }
                  title="WebXR"
                  description="Third Room now has WebXR support! You can now use your AR or VR headset to explore 3D worlds and interact with other users."
                />
                <WhatsNewCard
                  thumbnail={
                    <Thumbnail size="sm" bgColor="var(--bg-surface-low)">
                      <ThumbnailImg src="/creator-update/DiscoverPageThumbnail.jpg" />
                    </Thumbnail>
                  }
                  title="Discover Page"
                  description="Find and share scenes, worlds, and Matrix rooms created by the Third Room Community in the new Discover Page."
                />
                <WhatsNewCard
                  thumbnail={
                    <Thumbnail size="sm" bgColor="var(--bg-surface-low)">
                      <ThumbnailImg src="/creator-update/InspectorThumbnail.jpg" />
                    </Thumbnail>
                  }
                  title="In-World Inspector"
                  description="Inspect and adjust properties and scripts in your worlds using the new in-world inspector. Press the ` key to open the inspector in any world you have edit access to."
                />
              </Category>
            </Scroll>
          </div>
        }
        bottom={
          <Footer
            center={
              <div className="flex flex-column gap-xxs" style={{ padding: "var(--sp-xs)" }}>
                <Button onClick={createSpecialWorld}>Try the Script Editor</Button>
                <Button onClick={requestClose} fill="none" size="sm">
                  Maybe later
                </Button>
              </div>
            }
          />
        }
      />
    </Modal>
  );
}
