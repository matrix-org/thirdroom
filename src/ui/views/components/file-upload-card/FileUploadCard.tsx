import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import { Progress } from "../../../atoms/progress/Progress";
import { bytesToSize, getPercentage } from "../../../utils/common";
import CrossIC from "../../../../../res/ic/cross.svg";
import CheckIC from "../../../../../res/ic/check.svg";
import "./FileUploadCard.css";
import { Icon } from "../../../atoms/icon/Icon";

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
      {sentBytes < totalBytes && <Progress variant="secondary" value={sentBytes} max={totalBytes} />}
      <div className="flex items-center gap-xs">
        {sentBytes < totalBytes ? (
          <Text className="grow" variant="b3" color="surface-low">
            {`${getPercentage(totalBytes, sentBytes)}%`}
          </Text>
        ) : (
          <div className="grow flex items-start gap-xxs">
            <Text variant="b3" color="surface-low">
              Uploaded
            </Text>
            <Icon size="sm" color="secondary" src={CheckIC} />
          </div>
        )}
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
