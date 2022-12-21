import { useState, FormEvent, useCallback, useRef, KeyboardEvent } from "react";
import { produce } from "immer";

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
import { UserProfile, useSearchProfile } from "../../../hooks/useSearchProfile";
import { ProfileSuggestion } from "./ProfileSuggestion";
import { Chip } from "../../../atoms/chip/Chip";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Avatar } from "../../../atoms/avatar/Avatar";

const MXID_REG = /^@(\S+):(\S+)$/;
interface InviteDialogProps {
  roomId: string;
  requestClose: () => void;
}

export function InviteDialog({ roomId, requestClose }: InviteDialogProps) {
  const { session, platform } = useHydrogen(true);

  const formRef = useRef<HTMLFormElement>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteList, setInviteList] = useState<UserProfile[]>([]);

  const { loading, value: searchResult, setSearchTerm } = useSearchProfile(session);

  const addInvite = (profile: UserProfile) => {
    if (inviteList.find((p) => p.userId === profile.userId)) {
      return;
    }
    setInviteList(
      produce(inviteList, (draftList) => {
        draftList.push(profile);
      })
    );
  };

  const removeInvite = (profile: UserProfile) => {
    const index = inviteList.findIndex((p) => p.userId === profile.userId);
    if (index >= 0) {
      setInviteList(
        produce(inviteList, (draftList) => {
          draftList.splice(index, 1);
        })
      );
    }
  };

  const handleAddInvite = (profile: UserProfile) => {
    if (formRef.current) {
      const form = formRef.current.elements as typeof formRef.current.elements & {
        userIdInput: HTMLInputElement;
      };
      form.userIdInput.value = "";
      form.userIdInput.focus();
    }
    addInvite(profile);
  };

  const inviteUser = async (userId: string) => {
    if (inviting) return;
    const userIds = inviteList.map((profile) => profile.userId);
    if (userId.match(MXID_REG)) {
      userIds.push(userId);
    }
    if (userIds.length === 0) return;

    setInviting(true);
    const promise = Promise.allSettled(userIds.map((id) => session.hsApi.invite(roomId, id).response()));
    try {
      await promise;
    } catch {}
    setInviting(false);
    requestClose();
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const value = evt.currentTarget.userIdInput.value as string;
    inviteUser(value.trim());
  };

  const debouncedSuggestProfile = useDebounce(
    useCallback(
      (term: string) => {
        setSearchTerm(term);
      },
      [setSearchTerm]
    ),
    { wait: 400 }
  );

  const handleInputChange = (evt: FormEvent<HTMLInputElement>) => {
    const value = evt.currentTarget.value;
    if (!value.startsWith("@")) debouncedSuggestProfile(value);
  };

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    const value = evt.currentTarget.value.trim();

    if (evt.key === " " && value.match(MXID_REG)) {
      evt.preventDefault();
      handleAddInvite({ userId: value });
    }
    if (evt.key === "Enter") {
      if (value.length > 0) evt.preventDefault();
      if (value.match(MXID_REG)) handleAddInvite({ userId: value });
    }
    if (evt.key === "Backspace" && inviteList.length > 0 && value === "") {
      setInviteList(
        produce(inviteList, (draftList) => {
          draftList.pop();
        })
      );
    }
  };

  return (
    <div className="flex flex-column">
      <Header
        className="shrink-0"
        left={<HeaderTitle size="lg">Invite</HeaderTitle>}
        right={<IconButton iconSrc={CrossIC} onClick={requestClose} label="Close" />}
      />
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grow flex flex-column gap-sm"
        style={{ padding: "var(--sp-md)" }}
      >
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
              className="flex-wrap"
              onChange={handleInputChange}
              name="userIdInput"
              maxLength={255}
              autoFocus
              onKeyDown={handleKeyDown}
              placeholder="@user:server.name"
              before={
                inviteList.length > 0 && (
                  <div className="flex gap-xs flex-wrap" style={{ width: "100%", marginTop: "var(--sp-xs)" }}>
                    {inviteList.map((profile) => (
                      <Chip key={profile.userId}>
                        <Avatar
                          imageSrc={
                            profile.avatarUrl
                              ? getAvatarHttpUrl(profile.avatarUrl, 16, platform, session.mediaRepository)
                              : undefined
                          }
                          name={profile.displayName ?? profile.userId.slice(1)}
                          bgColor={`var(--usercolor${getIdentifierColorNumber(profile.userId)})`}
                          size="xxs"
                          shape="circle"
                        />
                        <Text className="truncate" variant="b3" weight="medium">
                          {profile.userId.slice(1)}
                        </Text>
                        <IconButton onClick={() => removeInvite(profile)} size="sm" iconSrc={CrossIC} label="Remove" />
                      </Chip>
                    ))}
                  </div>
                )
              }
            />
          </SettingTile>
          <div style={{ minHeight: "74px" }}>
            <ProfileSuggestion
              loading={loading}
              suggestion={searchResult?.results.filter((result) => !inviteList.find((p) => p.userId === result.userId))}
              onSelect={handleAddInvite}
            />
          </div>
        </div>
        <Button size="lg" type="submit">
          {inviting && <Dots color="on-primary" />}
          {inviting ? "Inviting" : "Invite"}
        </Button>
      </form>
    </div>
  );
}
