import { useState, FormEvent, useCallback, ChangeEvent } from "react";
import { RoomVisibility } from "@thirdroom/hydrogen-view-sdk";

import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Input } from "../../../atoms/input/Input";
import { Label } from "../../../atoms/text/Label";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { IconButton } from "../../../atoms/button/IconButton";
import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { Dots } from "../../../atoms/loading/Dots";
import { Icon } from "../../../atoms/icon/Icon";
import { useHydrogen } from "../../../hooks/useHydrogen";
import CrossIC from "../../../../../res/ic/cross.svg";
import InfoIC from "../../../../../res/ic/info.svg";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { useDebounce } from "../../../hooks/useDebounce";
import { useSearchProfile } from "../../../hooks/useSearchProfile";
import { ProfileSuggestion } from "./ProfileSuggestion";
import { isValidUserId, waitToCreateRoom } from "../../../utils/matrixUtils";

interface DmDialogProps {
  requestClose: () => void;
}

export function DmDialog({ requestClose }: DmDialogProps) {
  const { session } = useHydrogen(true);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string>();

  const { loading, value: searchResult, setSearchTerm } = useSearchProfile(session);

  const dmUser = async (userId: string) => {
    if (starting) return;
    setError(undefined);
    setStarting(true);
    if ((await isValidUserId(session.hsApi, userId)) === false) {
      setError(`User id "${userId}" is invalid. Failed to start direct message.`);
      setStarting(false);
      return;
    }
    const roomBeingCreated = session.createRoom({
      visibility: RoomVisibility.DirectMessage,
      invites: [userId],
    });
    await waitToCreateRoom(session, roomBeingCreated);
    requestClose();
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const value = evt.currentTarget.input.value as string;
    dmUser(value.trim());
  };

  const handleInputChange = useDebounce(
    useCallback(
      (evt: ChangeEvent<HTMLInputElement>) => {
        setError(undefined);
        setSearchTerm(evt.target.value);
      },
      [setSearchTerm]
    ),
    { wait: 400 }
  );

  return (
    <div className="flex flex-column">
      <Header
        className="shrink-0"
        left={<HeaderTitle size="lg">Direct Message</HeaderTitle>}
        right={<IconButton iconSrc={CrossIC} onClick={requestClose} label="Close" />}
      />
      <form onSubmit={handleSubmit} className="grow flex flex-column gap-lg" style={{ padding: "var(--sp-md)" }}>
        <div className="flex flex-column gap-sm">
          <SettingTile
            label={
              <>
                <Label>User Id</Label>
                <Tooltip content="User id looks like @user:server.name" side="right">
                  <Icon src={InfoIC} color="surface-low" size="sm" />
                </Tooltip>
              </>
            }
          >
            <Input
              onChange={handleInputChange}
              name="input"
              maxLength={255}
              autoFocus
              placeholder="@user:server.name"
              required
            />
          </SettingTile>
          {!starting && error && (
            <Text variant="b3" color="danger" weight="medium">
              {error}
            </Text>
          )}
          <ProfileSuggestion
            loading={loading}
            suggestion={searchResult?.results}
            onSelect={(profile) => dmUser(profile.userId)}
          />
        </div>
        <Button size="lg" type="submit">
          {starting && <Dots color="on-primary" />}
          {starting ? "Starting" : "Direct Message"}
        </Button>
      </form>
    </div>
  );
}
