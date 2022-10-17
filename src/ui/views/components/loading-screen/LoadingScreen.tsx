import classNames from "classnames";

import { Dots } from "../../../atoms/loading/Dots";
import { Text } from "../../../atoms/text/Text";
import { CoverScreen } from "../cover-screen/CoverScreen";

interface LoadingScreenProps {
  className?: string;
  message?: string;
}

export function LoadingScreen({ className, message }: LoadingScreenProps) {
  return (
    <CoverScreen className={classNames("gap-md", className)}>
      <Dots size="lg" />
      <Text variant="b3" weight="semi-bold">
        {message ? message : "Loading"}
      </Text>
    </CoverScreen>
  );
}
