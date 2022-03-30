import React from 'react';
import './ChatView.css';
import {
    RoomViewModel as ChatViewModel,
} from 'hydrogen-view-sdk';

import { Text } from '../../../atoms/text/Text';
import { TimelineView } from './TimelineView';
import { ComposerView } from './ComposerView';
import { useVMProp } from '../../../hooks/useVMProp';

interface IChatView {
  vm: typeof ChatViewModel;
  roomId: string;
}

export function ChatView({
    vm,
    roomId,
}: IChatView) {
    useVMProp(vm, 'timelineViewModel');

    return (
        <div className="ChatView flex flex-column" id="ChatView">
            <header className="flex items-center">
                <Text variant="s1" weight="semi-bold">{ vm.name }</Text>
            </header>
            {
                vm.timelineViewModel
                    ? <TimelineView roomId={roomId} vm={vm.timelineViewModel} />
                    : (
                        <div className="grow flex justify-center items-center">
                            <Text>loading...</Text>
                        </div>
                    )
            }
            <ComposerView vm={vm.composerViewModel} />
        </div>
    );
}
