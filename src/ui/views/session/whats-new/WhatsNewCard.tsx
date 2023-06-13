import { ReactNode } from "react";

import { Text } from "../../../atoms/text/Text";
import "./WhatsNewCard.css";

interface WhatsNewCardProps {
  thumbnail: ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
}
export function WhatsNewCard({ thumbnail, title, description }: WhatsNewCardProps) {
  return (
    <div className="WhatsNewCard flex items-start gap-md">
      <div>{thumbnail}</div>
      <div className="WhatsNewCard__content flex flex-column gap-xxs">
        <Text className="truncate" weight="medium">
          {title}
        </Text>
        <Text variant="b3">{description}</Text>
      </div>
    </div>
  );
}
