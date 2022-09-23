import { useState } from "react";
import { Room, RoomBeingCreated } from "@thirdroom/hydrogen-view-sdk";

import "./OnboardingModal.css";
import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { Footer } from "../../../atoms/footer/Footer";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { PaginationDot } from "../../../atoms/pagination/PaginationDot";
import { ShortcutUI } from "./ShortcutUI";
import { Modal } from "../../../atoms/modal/Modal";

interface OnboardingModalProps {
  open: boolean;
  requestClose: () => void;
  world: Room | RoomBeingCreated;
}

export function OnboardingModal({ open, world, requestClose }: OnboardingModalProps) {
  const { platform } = useHydrogen(true);
  const [screenNo, setScreenNo] = useState(1);
  const lastScreenNo = 2;

  return (
    <Modal open={open} className="OnboardingModal" size="sm">
      <Content
        top={<Header center={<HeaderTitle>{screenNo === 1 ? "Get Started" : "Controls"}</HeaderTitle>} />}
        children={
          <div className="OnboardingModal__content">
            {screenNo === 1 && (
              <div className="OnboardingModal__screen1 flex flex-column justify-center items-center gap-sm text-center">
                <Avatar
                  name={world.name || "Home World"}
                  size="xl"
                  shape="circle"
                  className="shrink-0"
                  bgColor={`var(--usercolor${getIdentifierColorNumber(world.id)})`}
                  imageSrc={
                    world.avatarUrl ? getAvatarHttpUrl(world.avatarUrl, 50, platform, world.mediaRepository) : undefined
                  }
                />
                <Text variant="h2" weight="semi-bold">
                  Welcome to your home world
                </Text>
                <Text>This is a private world to make your own that will evolve as Third Room grows.</Text>
                <Text>
                  We've set up a few portals in your space leading to public worlds for you to explore. You can get back
                  to this space at any time in the overlay.
                </Text>
                <Text>Have fun exploring Third Room!</Text>
              </div>
            )}
            {screenNo === 2 && (
              <Scroll type="hover">
                <ShortcutUI />
              </Scroll>
            )}
          </div>
        }
        bottom={
          <Footer
            left={
              screenNo > 1 ? (
                <Button onClick={() => setScreenNo(screenNo - 1)} fill="outline">
                  Back
                </Button>
              ) : (
                <></>
              )
            }
            center={<PaginationDot max={lastScreenNo} value={screenNo} />}
            right={
              <>
                {lastScreenNo === screenNo && <Button onClick={requestClose}>Finish</Button>}
                {screenNo < lastScreenNo && <Button onClick={() => setScreenNo(screenNo + 1)}>Next</Button>}
              </>
            }
          />
        }
      />
    </Modal>
  );
}
