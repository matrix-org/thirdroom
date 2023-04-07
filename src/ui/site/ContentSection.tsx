import "./ContentSection.css";
import { Text } from "../atoms/text/Text";
import { LeftRightContent } from "./components/LeftRightContent";
import { Icon } from "../atoms/icon/Icon";
import ArrowForwardIC from "../../../res/ic/arrow-forward.svg";

export function ContentSection() {
  return (
    <>
      <section className="ContentSection">
        <div className="ContentSection__content">
          <LeftRightContent
            title={
              <Text variant="h1" weight="bold">
                Add a third dimension to the conversation
              </Text>
            }
            content={
              <div className="flex flex-column gap-md">
                <Text variant="s1">
                  Whether you’re on your laptop or in an VR or AR headset, Third Room makes communicating 3D concepts
                  easy.
                </Text>
                <div className="flex flex-column gap-xs">
                  <Text variant="s1" weight="semi-bold">
                    Architecture and Civil Engineering
                  </Text>
                  <Text variant="s1">
                    Use Third Room’s support for Cesium’s 3D Tiles to bring in massive geospatial datasets.
                  </Text>
                </div>
                <div className="flex flex-column gap-xs">
                  <Text variant="s1" weight="semi-bold">
                    Industrial Design and Manufacturing
                  </Text>
                  <Text variant="s1">
                    Get up close and personal with a 3D design in AR or VR. Hop in and out of your virtual meeting room
                    with your colleagues.
                  </Text>
                </div>
                <a href="https://thirdroom.io" target="_blank" className="flex items-center gap-xxs">
                  <Text color="primary" type="span" weight="medium">
                    Contact Sales
                  </Text>
                  <Icon color="primary" src={ArrowForwardIC} />
                </a>
              </div>
            }
            imgSrc="/landing/ar-image.png"
            imgAlt="Industrial application Image"
          />
          <LeftRightContent
            flipped
            title={
              <Text variant="h1" weight="bold">
                Powered by Matrix
              </Text>
            }
            content={
              <div className="flex flex-column gap-md">
                <Text variant="s1">
                  Third Room is built on Matrix: an open network for secure, decentralized communication.
                </Text>
                <div className="flex flex-column gap-xs">
                  <Text variant="s1" weight="semi-bold">
                    Self Sovereign
                  </Text>
                  <Text variant="s1">
                    Third Room worlds are replicated across homeservers. There is no single point of control or failure
                    in the Matrix network. Every server has total self-sovereignty over its users data and anyone can
                    run a Matrix homeserver.
                  </Text>
                </div>
                <div className="flex flex-column gap-xs">
                  <Text variant="s1" weight="semi-bold">
                    Cryptography Not Cryptocurrency
                  </Text>
                  <Text variant="s1">
                    Communications over Matrix can use end to end encryption making sure that only the people in the
                    room are in on the conversation. User’s identities and messages can be cryptographically verified so
                    you know someone is who they say they are.
                  </Text>
                </div>
                <div className="flex flex-column gap-xs">
                  <Text variant="s1" weight="semi-bold">
                    Interoperable
                  </Text>
                  <Text variant="s1">
                    Third Room is just another Matrix client. You can chat with people in Third Room worlds from Element
                    on your phone or use your Matrix chat bot in your world. We’re active participants in improving
                    realtime communication on Matrix.
                  </Text>
                </div>

                <a href="https://matrix.org" target="_blank" className="flex items-center gap-xxs">
                  <Text color="primary" type="span" weight="medium">
                    Learn More About Matrix
                  </Text>
                  <Icon color="primary" src={ArrowForwardIC} />
                </a>
              </div>
            }
            imgSrc="/landing/matrix-graph.png"
            imgAlt="Matrix decentralized servers Image"
          />
        </div>
      </section>
      <section className="ContentSection ContentSection--low">
        <div className="ContentSection__content">
          <LeftRightContent
            flipRatio
            title={
              <Text variant="h1" weight="bold">
                WebSceneGraph: The DOM API for 3D
              </Text>
            }
            content={
              <div className="flex flex-column gap-md">
                <Text variant="s1">
                  Use the WebSceneGraph API to add interactions and behaviors to Third Room worlds. You can write
                  scripts in any language that compiles to WebAssembly, including JavaScript via QuickJS. WebAssembly
                  provides a fast, safe and interoperable runtime for user generated content.
                </Text>
                <a href="https://thirdroom.io/docs" target="_blank" className="flex items-center gap-xxs">
                  <Text color="primary" type="span" weight="medium">
                    WebSceneGraph Documentation
                  </Text>
                  <Icon color="primary" src={ArrowForwardIC} />
                </a>
              </div>
            }
            imgSrc="/landing/WebSGImage.png"
            imgAlt="WebSG Image"
          />
          <LeftRightContent
            flipped
            title={
              <Text variant="h1" weight="bold">
                Create and render photorealistic graphics
              </Text>
            }
            content={
              <div className="flex flex-column gap-md">
                <Text variant="s1">
                  Harness the power of Unity’s editor and Third Room’s high performance WebGL engine.
                </Text>
                <a href="https://thirdroom.io/docs" target="_blank" className="flex items-center gap-xxs">
                  <Text color="primary" type="span" weight="medium">
                    WebSceneGraph Documentation
                  </Text>
                  <Icon color="primary" src={ArrowForwardIC} />
                </a>
              </div>
            }
            imgSrc="/landing/photo-real-graphics.png"
            imgAlt="Photo Realistic Graphic Image"
          />
        </div>
      </section>
      <section className="ContentSection">
        <div className="ContentSection__content">
          <div className="flex flex-column items-center gap-lg text-center" style={{ maxWidth: 780, margin: "auto" }}>
            <Text style={{ maxWidth: 570 }} variant="h1" weight="bold">
              Pushing the immersive web forward
            </Text>
            <Text variant="s1">
              We’re continuously shipping features to make Third Room the best virtual world platform out there. Here’s
              what’s coming soon:
            </Text>
            <div className="flex flex-column gap-md text-start" style={{ maxWidth: 526 }}>
              <div className="flex items-center gap-md">
                <svg width="48" height="49" viewBox="0 0 48 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M37 41.0077L25.85 29.9077L28.7 27.0577L39.85 38.2077C40.25 38.6077 40.45 39.0744 40.45 39.6077C40.45 40.141 40.25 40.6077 39.85 41.0077C39.45 41.4077 38.975 41.6077 38.425 41.6077C37.875 41.6077 37.4 41.4077 37 41.0077ZM7.95001 41.0077C7.55001 40.6077 7.35001 40.1327 7.35001 39.5827C7.35001 39.0327 7.55001 38.5577 7.95001 38.1577L21 25.1077L15.65 19.7577L15.55 19.8577C15.25 20.1577 14.9 20.3077 14.5 20.3077C14.1 20.3077 13.75 20.1577 13.45 19.8577L12.3 18.7077V22.9577L11.9 23.3577C11.6667 23.591 11.4 23.7077 11.1 23.7077C10.8 23.7077 10.5333 23.591 10.3 23.3577L5.80001 18.8577C5.56668 18.6244 5.45001 18.3577 5.45001 18.0577C5.45001 17.7577 5.56668 17.491 5.80001 17.2577L6.20001 16.8577H10.5L9.15001 15.5077C8.85001 15.2077 8.70001 14.8577 8.70001 14.4577C8.70001 14.0577 8.85001 13.7077 9.15001 13.4077L14.65 7.90771C15.2167 7.34105 15.8333 6.95771 16.5 6.75771C17.1667 6.55771 17.9 6.45771 18.7 6.45771C19.5 6.45771 20.2333 6.59938 20.9 6.88271C21.5667 7.16605 22.1833 7.59105 22.75 8.15771L17.4 13.5077L18.75 14.8577C19.05 15.1577 19.2 15.5077 19.2 15.9077C19.2 16.3077 19.05 16.6577 18.75 16.9577L18.6 17.1077L23.8 22.3077L29.9 16.2077C29.6333 15.7744 29.425 15.2744 29.275 14.7077C29.125 14.141 29.05 13.541 29.05 12.9077C29.05 11.141 29.6917 9.61605 30.975 8.33271C32.2583 7.04938 33.7833 6.40771 35.55 6.40771C36.05 6.40771 36.475 6.45771 36.825 6.55771C37.175 6.65771 37.4667 6.79105 37.7 6.95771L33.45 11.2077L37.2 14.9577L41.45 10.7077C41.6167 10.9744 41.7584 11.2994 41.875 11.6827C41.9917 12.066 42.05 12.5077 42.05 13.0077C42.05 14.7744 41.4083 16.2994 40.125 17.5827C38.8417 18.866 37.3167 19.5077 35.55 19.5077C34.95 19.5077 34.4333 19.466 34 19.3827C33.5667 19.2994 33.1667 19.1744 32.8 19.0077L10.75 41.0577C10.35 41.4577 9.88335 41.6494 9.35001 41.6327C8.81668 41.616 8.35001 41.4077 7.95001 41.0077Z"
                    fill="#168BF6"
                  />
                </svg>
                <div className="flex flex-column gap-xxs">
                  <Text weight="medium">Realtime Collaborative Editor</Text>
                  <Text>Create virtual worlds with your teammates without leaving your browser.</Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
