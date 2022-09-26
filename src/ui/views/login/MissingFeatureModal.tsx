import { useNavigate } from "react-router-dom";

import { MissingFeature, SUPPORTED_FIREFOX_VERSION } from "../../utils/featureCheck";
import { Modal } from "../../atoms/modal/Modal";
import { Content } from "../../atoms/content/Content";
import { Scroll } from "../../atoms/scroll/Scroll";
import { Footer } from "../../atoms/footer/Footer";
import { Text } from "../../atoms/text/Text";
import { Button } from "../../atoms/button/Button";

export function getMissingFeatureToMsg(missingFeature: MissingFeature) {
  switch (missingFeature) {
    case MissingFeature.SHARED_ARRAY_BUFFER:
      return (
        <>
          No{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer"
            target="_blank"
          >
            SharedArrayBuffer
          </a>{" "}
          found.
        </>
      );
    case MissingFeature.MIN_FIREFOX_VERSION:
      return `Firefox version ${SUPPORTED_FIREFOX_VERSION} or below is not supported. Please update your browser.`;
    case MissingFeature.WEB_GL2:
      return "No webGL2 support found.";
    case MissingFeature.WEB_GL_HARDWARE_ACC:
      return "WebGL2 Hardware acceleration is disabled.";
    case MissingFeature.WEB_RTC:
      return "WebRTC is not supported.";
    case MissingFeature.INDEXED_DB:
      return "Access to IndexedDB is disabled.";
  }
}

export function MissingFeatureModal({ missingFeatures }: { missingFeatures: MissingFeature[] }) {
  const navigate = useNavigate();
  return (
    <Modal className="MissingFeature" overlayClassName="MissingFeature__overlay" size="sm" open={true}>
      <Content
        children={
          <Scroll>
            <div className="MissingFeature__content">
              <Text variant="h2" weight="semi-bold">
                Incompatible Browser
              </Text>
              <Text>This may be happening because of following reason(s):</Text>
              <ul>
                {missingFeatures.map((m, i) => (
                  <li key={i}>
                    <Text variant="b2" type="span">
                      {getMissingFeatureToMsg(m)}
                    </Text>
                  </li>
                ))}
              </ul>

              <Button size="sm" fill="outline" onClick={() => navigate("/")}>
                Go Back
              </Button>
            </div>
          </Scroll>
        }
        bottom={
          <Footer
            center={
              <Text type="div" variant="b2">
                <a href="https://matrix.to/#/#thirdroom-dev:matrix.org" target="_blank">
                  Get help in our Matrix room.
                </a>
              </Text>
            }
          />
        }
      />
    </Modal>
  );
}
