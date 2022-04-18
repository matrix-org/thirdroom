import { Text } from "../../../atoms/text/Text";

interface IRoomTileTitle {
  children: string;
}

export function RoomTileTitle({ children }: IRoomTileTitle) {
  return (
    <Text className="truncate" weight="medium">
      {children}
    </Text>
  );
}
