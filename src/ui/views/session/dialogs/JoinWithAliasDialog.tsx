import { useState, FormEvent } from "react";

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

interface JoinWithAliasDialogProps {
  requestClose: () => void;
}

export function JoinWithAliasDialog({ requestClose }: JoinWithAliasDialogProps) {
  const { session } = useHydrogen(true);

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (joining) return;
    setError(undefined);

    const value = evt.currentTarget.input.value as string;
    const aliasOrId = value.trim();

    if (aliasOrId === "") return;
    if (aliasOrId.match(/^(!|#).+:.+$/) == undefined) {
      setError(
        `Invalid ${
          aliasOrId.startsWith("!") ? "id" : "alias"
        } "${aliasOrId}". Alias will look like #example:server.name`
      );
      return;
    }

    setJoining(true);
    try {
      await session.joinRoom(aliasOrId);
      requestClose();
    } catch (err) {
      setError(`Failed to join "${aliasOrId}". Either world/room is private or doesn't exist.`);
    }
    setJoining(false);
  };

  const handleInputChange = () => {
    setError(undefined);
  };

  return (
    <div className="flex flex-column">
      <Header
        className="shrink-0"
        left={<HeaderTitle size="lg">Join with Alias</HeaderTitle>}
        right={<IconButton iconSrc={CrossIC} onClick={requestClose} label="Close" />}
      />
      <form onSubmit={handleSubmit} className="grow flex flex-column gap-lg" style={{ padding: "var(--sp-md)" }}>
        <div className="flex flex-column gap-sm">
          <SettingTile
            label={
              <>
                <Label>Alias</Label>
                <Tooltip content="Use alias or id." side="right">
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
              placeholder="#example:server.name"
              required
            />
          </SettingTile>
          {!joining && error && (
            <Text variant="b3" color="danger" weight="medium">
              {error}
            </Text>
          )}
        </div>
        <Button size="lg" type="submit">
          {joining && <Dots color="on-primary" />}
          {joining ? "Joining" : "Join"}
        </Button>
      </form>
    </div>
  );
}
