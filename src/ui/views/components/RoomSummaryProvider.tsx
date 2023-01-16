import { SummaryData, useRoomSummary } from "../../hooks/useRoomSummary";

export function RoomSummaryProvider({
  roomIdOrAlias,
  fallback,
  children,
}: {
  roomIdOrAlias: string;
  fallback: () => JSX.Element;
  children: (summary: SummaryData) => JSX.Element;
}) {
  const summary = useRoomSummary(roomIdOrAlias);
  if (!summary) return fallback();
  return children(summary);
}
