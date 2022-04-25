import { Text } from "../../../atoms/text/Text";

interface IRoomTileDesc {
  children: string;
}

export function RoomTileDesc({ children }: IRoomTileDesc) {
  return (
    <Text className="truncate" color="surface-low" variant="b3">
      {children}
    </Text>
  );
}
