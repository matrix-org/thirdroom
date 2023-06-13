import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";

import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import CopyIC from "../../../../../res/ic/copy.svg";
import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { copyToClipboard } from "../../../utils/common";
import { useHydrogen } from "../../../hooks/useHydrogen";
import "./UserMenu.css";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { userProfileAtom } from "../../../state/userProfile";
import { RageshakeDialog } from "../rageshake/RageshakeDialog";

export function UserMenu() {
  const { session, platform, logout } = useHydrogen(true);
  const { accountManagementUrl } = session.sessionInfo;
  const { userId, displayName, avatarUrl } = useAtomValue(userProfileAtom);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const [copied, setCopied] = useState(false);
  const [bugReport, setBugReport] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    if (copied) return;
    setCopied(true);
    copyToClipboard(userId);
    setTimeout(() => setCopied(false), 500);
  };

  return (
    <>
      <RageshakeDialog open={bugReport} requestClose={() => setBugReport(false)} />
      <DropdownMenu
        content={
          <div className="UserMenu flex flex-column gap-xs">
            <div className="UserMenu__header">
              <Text weight="medium">{displayName}</Text>
              <div className="flex items-center gap-xxs">
                <Text className="truncate" variant="b3" color="surface-low">
                  {userId}
                </Text>
                <Tooltip open={copied} content={copied ? "Copied" : "Copy"} side="top">
                  <IconButton
                    onClick={handleCopy}
                    className="shrink-0"
                    size="sm"
                    iconSrc={CopyIC}
                    variant="primary"
                    label="Copy user id"
                  />
                </Tooltip>
              </div>
            </div>
            <div>
              <DropdownMenuItem onSelect={() => setOverlayWindow({ type: OverlayWindow.UserProfile })}>
                User Settings
              </DropdownMenuItem>
              {accountManagementUrl && (
                <DropdownMenuItem onSelect={() => window.open(accountManagementUrl)}>Manage Account</DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => navigate("/landing")}>Landing Page</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setBugReport(true)}>Report Bug</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (confirm("Are you sure?")) logout();
                }}
                variant="danger"
              >
                Logout
              </DropdownMenuItem>
            </div>
          </div>
        }
      >
        <Avatar
          onClick={() => false /* used for keyboard focus */}
          shape="circle"
          name={displayName}
          bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
          imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 40, platform, session.mediaRepository) : undefined}
        />
      </DropdownMenu>
    </>
  );
}
