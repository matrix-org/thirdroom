import { ReactNode, useState, FormEvent, useEffect, useCallback, ChangeEvent } from "react";

import { Dialog } from "../../../atoms/dialog/Dialog";
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
import { Chip } from "../../../atoms/chip/Chip";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getMxIdUsername } from "../../../utils/matrixUtils";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Scroll } from "../../../atoms/scroll/Scroll";

interface InviteDialogProps {
  roomId: string;
  renderTrigger: (openDialog: () => void) => ReactNode;
}

export function InviteDialog({ roomId, renderTrigger }: InviteDialogProps) {
  const { session, platform } = useHydrogen(true);

  const [isOpen, setIsOpen] = useState(false);
  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string>();

  const { value: searchResult, setSearchTerm } = useSearchProfile(session.hsApi);

  useEffect(() => {
    if (isOpen === false) {
      setInviting(false);
      setError(undefined);
      setSearchTerm(undefined);
    }
  }, [isOpen, setSearchTerm]);

  const inviteUser = async (userId: string) => {
    if (inviting) return;
    setError(undefined);

    if (userId === "") return;
    if (userId.match(/^@.+:.+$/) == undefined) {
      setError(`Invalid user id "${userId}".`);
      return;
    }

    setInviting(true);
    try {
      await session.hsApi.profile(userId).response();
    } catch (err) {
      setError(`User id "${userId}" doesn't exist. Failed to invite.`);
      setInviting(false);
      return;
    }
    try {
      await session.hsApi.invite(roomId, userId).response();
      closeDialog();
    } catch (err) {
      setError(`Failed to invite "${userId}".`);
    }
    setInviting(false);
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const value = evt.currentTarget.input.value as string;
    inviteUser(value.trim());
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
    <>
      {renderTrigger(openDialog)}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex flex-column">
          <Header
            className="shrink-0"
            left={<HeaderTitle size="lg">Invite</HeaderTitle>}
            right={<IconButton iconSrc={CrossIC} onClick={closeDialog} label="Close" />}
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
                />
              </SettingTile>
              {!inviting && error && (
                <Text variant="b3" color="danger" weight="medium">
                  {error}
                </Text>
              )}
              <SettingTile label={<Label>Suggestions</Label>}>
                {!searchResult ? (
                  <Text variant="b3">Your input suggestion will appear here.</Text>
                ) : searchResult.results.length === 0 ? (
                  <Text variant="b3">No suggestion found.</Text>
                ) : (
                  <Scroll type="hover" orientation="horizontal">
                    <div style={{ paddingBottom: "var(--sp-sm)" }} className="flex items-center gap-xs">
                      {(() => {
                        const profiles = searchResult.results;
                        return profiles.map(
                          (profile: { user_id: string; avatar_url?: string; display_name?: string }) => {
                            const name = profile.display_name ?? getMxIdUsername(profile.user_id);
                            const avatarHttpUrl = profile.avatar_url
                              ? getAvatarHttpUrl(profile.avatar_url, 16, platform, session.mediaRepository)
                              : undefined;
                            return (
                              <Chip key={profile.user_id} onClick={(e) => inviteUser(profile.user_id)}>
                                <Avatar
                                  imageSrc={avatarHttpUrl}
                                  name={name}
                                  bgColor={`var(--usercolor${getIdentifierColorNumber(profile.user_id)})`}
                                  size="xxs"
                                  shape="circle"
                                />
                                <Text className="truncate" variant="b3" weight="medium">
                                  {name}
                                </Text>
                              </Chip>
                            );
                          }
                        );
                      })()}
                    </div>
                  </Scroll>
                )}
              </SettingTile>
            </div>
            <Button size="lg" type="submit">
              {inviting && <Dots color="on-primary" />}
              {inviting ? "Inviting" : "Invite"}
            </Button>
          </form>
        </div>
      </Dialog>
    </>
  );
}
