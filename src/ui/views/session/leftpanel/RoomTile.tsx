import './RoomTile.css';

import { Text } from '../../../atoms/text/Text';
import { Thumbnail } from '../../../atoms/thumbnail/Thumbnail';

interface IRoomTile {
  name: string;
  roomColor: string;
  avatarUrl: string;
  isActive?: boolean;
  onClick: () => void;
}

export function RoomTile({
    name,
    roomColor,
    avatarUrl,
    isActive = false,
    onClick,
}: IRoomTile) {
    return (
        <button
            onClick={onClick}
            className={`RoomTile${isActive ? '--active' : ''} flex items-start`}
        >
            <Thumbnail
                className="shrink-0"
                name={name}
                bgColor={roomColor}
                imageSrc={avatarUrl}
            />
            <div className="RoomTile__info grow flex flex-column">
                <Text className="truncate" variant="b2" weight="semi-bold">
                    { name }
                </Text>
            </div>
        </button>
    );
}
