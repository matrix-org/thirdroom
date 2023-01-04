import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import { Progress } from "../../../atoms/progress/Progress";
import { bytesToSize, getPercentage } from "../../../utils/common";
import CrossIC from "../../../../../res/ic/cross.svg";
import "./FileUploadCard.css";

interface FileUploadCardProps {
  className?: string;
  name: string;
  totalBytes: number;
  sentBytes: number;
  onUploadDrop: () => void;
}

export function FileUploadCard({ className, name, sentBytes, totalBytes, onUploadDrop }: FileUploadCardProps) {
  return (
    <div className={classNames("FileUploadCard flex flex-column gap-xs", className)}>
      <div className="flex items-center gap-xs">
        <div className="grow">
          <Text className="truncate" variant="b2" weight="medium">
            {name}
          </Text>
        </div>
        <IconButton onClick={onUploadDrop} iconSrc={CrossIC} size="sm" label="cancel" />
      </div>
      <Progress variant="secondary" value={sentBytes} max={totalBytes} />
      <div className="flex items-center gap-xs">
        <Text className="grow" variant="b3" color="surface-low">
          {sentBytes < totalBytes ? `${getPercentage(totalBytes, sentBytes)}%` : "Completed"}
        </Text>
        <Text variant="b3" color="surface-low">
          {sentBytes < totalBytes ? `${bytesToSize(sentBytes)} / ${bytesToSize(totalBytes)}` : bytesToSize(totalBytes)}
        </Text>
      </div>
    </div>
  );
}

interface FileUploadErrorCardProps {
  className?: string;
  name: string;
  message?: string;
  onUploadDrop: () => void;
}
export function FileUploadErrorCard({ className, name, message, onUploadDrop }: FileUploadErrorCardProps) {
  return (
    <div className={classNames("FileUploadCard flex flex-column gap-xxs", className)}>
      <div className="flex items-center gap-xs">
        <div className="grow">
          <Text color="danger" className="truncate" variant="b2" weight="medium">
            {name}
          </Text>
        </div>
        <IconButton onClick={onUploadDrop} iconSrc={CrossIC} size="sm" label="cancel" />
      </div>
      {message && <Text variant="b3">{message}</Text>}
    </div>
  );
}
