import './RoomTile.css';

import { Text } from '../../../atoms/text/Text';
import { Avatar } from '../../../atoms/avatar/Avatar';

interface IRoomTile {
  name: string,
  avatarUrl: string,
  isActive?: boolean,
  openRoomUrl: string,
}

export function RoomTile({
  name,
  avatarUrl,
  isActive = false,
  openRoomUrl,
}: IRoomTile) {
  return (
    <a
      href={openRoomUrl}
      className={`RoomTile${isActive ? '--active' : ''} flex items-center`}
    >
      <Avatar
        name={name}
        bgColor="var(--bg-primary)"
        imageSrc={avatarUrl}
      />
      <Text className="truncate" variant="b2" weight="semi-bold">
        {name}
      </Text>
    </a>
  );
}