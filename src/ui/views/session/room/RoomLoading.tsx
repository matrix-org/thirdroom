import React from "react";
import './RoomLoading.css';

import { RoomViewModel } from '../../../../viewModels/session/room/RoomViewModel';

import { Text } from "../../../atoms/text/Text";
import { Button } from '../../../atoms/button/Button';

import ArrowBackIC from '../../../../../res/ic/arrow-back.svg';
import SettingIC from '../../../../../res/ic/setting.svg';

interface IRoomLoading {
  vm: RoomViewModel,
}

export function RoomLoading({
  vm
}: IRoomLoading) {
  return (
    <div className="RoomLoading grow flex">
      <div className="RoomLoading_preview grow flex flex-column items-start">
        <div style={{ backgroundImage: `url(${vm.getRoomAvatarHttpUrl()})` }} />
        <div className="grow">
          <Button
            iconSrc={ArrowBackIC}
            onClick={() => alert('back to dashboard')}
          >
            Back to Dashbaord
          </Button>
        </div>
        <div className="RoomLoading__card flex">
          <div />
          <div className="grow">
            <Text className="truncate" variant="b2" weight="semi-bold">Home</Text>
            <Text className="truncate" variant="h2" weight="semi-bold">{vm.name || 'Empty room'}</Text>
          </div>
        </div>
      </div>
      <div className="RoomLoading__avatar flex flex-column">
        <div className="flex justify-end">
          <Button iconSrc={SettingIC} onClick={() => alert('settings')}>Settings</Button>
        </div>
        <div className="grow"></div>
        <div></div>
      </div>
    </div>
  );
}