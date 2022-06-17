import { ScenePreview } from "./ScenePreview";
import { Text } from "../../../atoms/text/Text";
import LogoSvg from "../../../../../res/svg/logo.svg";

export const title = "ScenePreview";

export default function ScenePreviewStories() {
  return (
    <div style={{ width: "200px", height: "200px" }}>
      <ScenePreview
        fallback={
          <Text variant="b3" color="surface-low" weight="medium">
            Your uploaded scene preview will appear here.
          </Text>
        }
      />
      <ScenePreview src={LogoSvg} />
    </div>
  );
}
