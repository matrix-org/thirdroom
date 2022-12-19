import { Session, StateEvent } from "@thirdroom/hydrogen-view-sdk";

export function useOrderMove(
  session: Session,
  roomId: string,
  orderedEvents: StateEvent[],
  order: {
    validStr: (str: string) => boolean;
    getMidStr: () => string;
    getNextStr: (str: string) => string | null;
  }
) {
  const handleMoveUp = async (targetIndex: number) => {
    if (targetIndex < 1) return false;
    let orderString: string | null = order.getMidStr();
    let startIndex = 0;

    for (let selectIndex = targetIndex - 1; selectIndex >= 0; selectIndex = selectIndex - 1) {
      const selectEvent = orderedEvents[selectIndex];
      const selectOrder = selectEvent.content.order;
      if (order.validStr(selectOrder)) {
        orderString = order.getNextStr(selectOrder);
        startIndex = selectIndex + 1;
        break;
      }
    }

    for (let selectIndex = startIndex; selectIndex <= targetIndex; selectIndex = selectIndex + 1) {
      if (selectIndex === targetIndex) {
        const prevEvent = orderedEvents[selectIndex - 1];
        const targetEvent = orderedEvents[selectIndex];

        session.hsApi.sendState(roomId, prevEvent.type, prevEvent.state_key, {
          ...prevEvent.content,
          order: targetEvent.content.order,
        });
        session.hsApi.sendState(roomId, targetEvent.type, targetEvent.state_key, {
          ...targetEvent.content,
          order: prevEvent.content.order,
        });
        return true;
      }
      if (selectIndex + 1 === targetIndex) {
        const selectEvent = orderedEvents[selectIndex];
        const targetEvent = orderedEvents[selectIndex + 1];
        session.hsApi.sendState(roomId, selectEvent.type, selectEvent.state_key, {
          ...selectEvent.content,
          order: targetEvent.content.order,
        });
        session.hsApi.sendState(roomId, targetEvent.type, targetEvent.state_key, {
          ...targetEvent.content,
          order: orderString,
        });
        return true;
      }

      if (!orderString) return false;
      const selectEvent = orderedEvents[selectIndex];
      session.hsApi.sendState(roomId, selectEvent.type, selectEvent.state_key, {
        ...selectEvent.content,
        order: orderString,
      });
      orderString = order.getNextStr(orderString);
    }
    return true;
  };

  return handleMoveUp;
}
