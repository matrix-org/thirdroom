import React from 'react';

import './RoomPreview.css';
import { RoomViewModel } from '../../../../viewModels/session/room/RoomViewModel';
import { InviteViewModel } from '../../../../viewModels/session/room/InviteViewModel';
import { Text } from '../../../atoms/text/Text';
import { Avatar } from '../../../atoms/avatar/Avatar';
import { Button } from '../../../atoms/button/Button';
import { Thumbnail } from '../../../atoms/thumbnail/Thumbnail';
import { Scroll } from '../../../atoms/scroll/Scroll';

interface IRoomPreview {
  vm: RoomViewModel | InviteViewModel;
  roomId: string;
}

export function RoomPreview({
    vm,
    roomId,
}: IRoomPreview) {
    const roomName = vm.name || 'Empty room';

    return (
        <div className="RoomPreview grow flex flex-column">
            <header className="flex items-center justify-end">
                <Button variant="primary" onClick={() => alert('create room')}>Create room</Button>
                <Avatar
                    isCircle
                    size="large"
                    name="Test"
                    imageSrc="https://images.unsplash.com/photo-1642773156765-6f5e392dec03?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80"
                    bgColor="var(--bg-primary)"
                />
            </header>
            <Scroll className="grow">
                <div className="RoomPreview__content">
                    <Thumbnail
                        size="large"
                        name={roomName}
                        bgColor={vm.getRoomColor()}
                        imageSrc={vm.getRoomAvatarHttpUrl()}
                    />
                    <Text variant="h2" weight="semi-bold">{ roomName }</Text>
                    <Button variant="primary" onClick={() => vm.setRoomFlow('load')}>Join room</Button>
                </div>
            </Scroll>
        </div>
    );
}
