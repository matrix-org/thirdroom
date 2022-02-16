import './RoomTile.css';

import { Text } from '../../../atoms/text/Text';
import { Avatar } from '../../../atoms/avatar/Avatar';

interface IRoomTile {
  name: string,
  avatarUrl: string,
}

export function RoomTile({
  name,
  avatarUrl,
}: IRoomTile) {
  return (
    <div className="RoomTile flex items-center">
      <Avatar
        name={name}
        bgColor="var(--bg-primary)"
        imageSrc={avatarUrl}
      />
      <Text className="truncate" variant="b2" weight="semi-bold">
        {name}
      </Text>
    </div>
  );
}