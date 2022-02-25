import React from "react";
import './RoomListView.css';

import { Room } from 'hydrogen-view-sdk';

import { RoomListViewModel } from '../../../../viewModels/session/leftpanel/RoomListViewModel';

import { Text } from '../../../atoms/text/Text';
import { Button } from '../../../atoms/button/Button';
import { Scroll } from '../../../atoms/scroll/Scroll';
import { RoomTile } from "./RoomTile";

import AddBoxIC from '../../../../../res/ic/add-box.svg';
import ManageSearchIC from '../../../../../res/ic/manage-search.svg';

import { useVMProp } from '../../../hooks/useVMProp';

interface IRoomListView {
  vm: RoomListViewModel,
}

export function RoomListView({ vm }: IRoomListView) {
  const allRooms: typeof Room[] = useVMProp(vm, 'allRooms');
  const activeRoom: string = useVMProp(vm, 'activeRoomId');
  
  return (
    <div className="RoomListView flex flex-column">
      <header className="flex items-center">
        <Text className="truncate" variant="h2" weight="semi-bold">Home</Text>
      </header>
      <div className="RoomListView__container grow">
        <Scroll>
          <div className="RoomListView__content">
            <header className="flex items-center">
              <Text className="grow" variant="b2" weight="semi-bold">Rooms</Text>
              <Button iconSrc={AddBoxIC} size="extra-small" onClick={() => alert('create room')}>Create</Button>
              <Button iconSrc={ManageSearchIC} size="extra-small" onClick={() => alert('Discover')}>Discover</Button>
            </header>
            {
              allRooms.map((room) => (
                <RoomTile
                  key={room.id}
                  roomColor={vm.getRoomColor(room)}
                  isActive={room.id === activeRoom}
                  openRoomUrl={vm.urlCreator.openRoomActionUrl(room.id)}
                  name={room.name || 'Empty room'}
                  avatarUrl={vm.getRoomAvatarHttpUrl(room, 32)}
                />
              ))
            }
          </div>
        </Scroll>
      </div>
    </div>
  );
}
