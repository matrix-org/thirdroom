import { Text } from "../../../atoms/text/Text";

interface IRoomTileDesc {
  children: string;
}

export function RoomTileDesc({ children }: IRoomTileDesc) {
  return (
    <Text className="truncate" variant="b3">
      {children}
    </Text>
  );
}
