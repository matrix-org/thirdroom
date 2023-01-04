import { Label } from "../../../atoms/text/Label";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Text } from "../../../atoms/text/Text";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Chip } from "../../../atoms/chip/Chip";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { UserProfile } from "../../../hooks/useSearchProfile";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";

export function ProfileSuggestion({
  loading,
  suggestion,
  onSelect,
}: {
  loading: boolean;
  onSelect: (userProfile: UserProfile) => void;
  suggestion?: UserProfile[];
}) {
  const { session, platform } = useHydrogen(true);
  return (
    <SettingTile label={<Label>Suggestions</Label>}>
      {loading ? (
        <Text variant="b3">Looking for suggestion...</Text>
      ) : !suggestion ? (
        <Text variant="b3">Type username for suggestions.</Text>
      ) : suggestion.length === 0 ? (
        <Text variant="b3">No suggestion found.</Text>
      ) : (
        <Scroll type="hover" orientation="horizontal">
          <div style={{ paddingBottom: "var(--sp-sm)" }} className="flex flex-wrap items-center gap-xs">
            {(() => {
              return suggestion.map((profile, index) => {
                return (
                  <Tooltip delayDuration={0} key={profile.userId} side="top" content={profile.userId}>
                    <Chip onClick={(e) => onSelect(profile)}>
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
                        {suggestion
                          .slice(0, index)
                          .find((p) => profile.displayName?.toLowerCase() === p.displayName?.toLowerCase())
                          ? profile.userId.slice(1)
                          : profile.displayName ?? profile.userId.slice(1)}
                      </Text>
                    </Chip>
                  </Tooltip>
                );
              });
            })()}
          </div>
        </Scroll>
      )}
    </SettingTile>
  );
}
