import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";
import "./CreateWorldPreview.css";

interface CreateWorldPreviewProps {
  className?: string;
  src?: string;
  alt?: string;
}

export function CreateWorldPreview({ className, src, alt }: CreateWorldPreviewProps) {
  return (
    <div className={classNames("CreateWorldPreview flex justify-center items-center", className)}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <Text variant="b3" color="surface-low" weight="medium">
          Your uploaded scene preview will appear here.
        </Text>
      )}
    </div>
  );
}
