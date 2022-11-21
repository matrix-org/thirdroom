import { Session } from "@thirdroom/hydrogen-view-sdk";

import { useAsyncCallback } from "../../hooks/useAsyncCallback";

export function JoinRoomProvider({
  session,
  children,
}: {
  session: Session;
  children: (
    join: (aliasOrId: string) => Promise<unknown>,
    isJoined: boolean,
    loading: boolean,
    error: Error | undefined
  ) => JSX.Element | null;
}) {
  const { value, loading, error, callback } = useAsyncCallback<(aliasOrId: string) => Promise<string>, string>(
    async (aliasOrId: string) => {
      const res = await session.hsApi.joinIdOrAlias(aliasOrId).response();
      const rId = res?.room_id ?? undefined;
      return rId;
    },
    [session]
  );

  const isJoined = typeof value === "string";

  return children(callback, isJoined, loading, error);
}
