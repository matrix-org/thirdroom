import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";

interface IRoomTileTitle {
  className?: string;
  children: string;
}

export function RoomTileTitle({ className, children }: IRoomTileTitle) {
  return (
    <Text className={classNames("truncate", className)} weight="medium">
      {children}
    </Text>
  );
}
