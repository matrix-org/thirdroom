import { Text } from "../../../atoms/text/Text";

interface INowPlayingTitle {
  children: string;
}

export function NowPlayingTitle({ children }: INowPlayingTitle) {
  return <Text className="truncate">{children}</Text>;
}
