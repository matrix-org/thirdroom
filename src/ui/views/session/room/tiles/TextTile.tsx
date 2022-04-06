import { Text } from "../../../../atoms/text/Text";
import "./TextTile.css";

export function TextTile({ sender, body }: { sender: string; body: string }) {
  return (
    <div className="TextTile">
      <Text variant="b2">
        <Text className="TextTile__sender" variant="b2" weight="semi-bold" type="span">
          {sender}
        </Text>
        {body}
      </Text>
    </div>
  );
}
