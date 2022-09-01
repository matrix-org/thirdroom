import { Label } from "../../../atoms/text/Label";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Text } from "../../../atoms/text/Text";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Chip } from "../../../atoms/chip/Chip";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getMxIdUsername } from "../../../utils/matrixUtils";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { UserProfile } from "../../../hooks/useSearchProfile";

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
          <div style={{ paddingBottom: "var(--sp-sm)" }} className="flex items-center gap-xs">
            {(() => {
              return suggestion.map((profile) => {
                const name = profile.displayName ?? getMxIdUsername(profile.userId);
                const avatarHttpUrl = profile.avatarUrl
                  ? getAvatarHttpUrl(profile.avatarUrl, 16, platform, session.mediaRepository)
                  : undefined;
                return (
                  <Chip key={profile.userId} onClick={(e) => onSelect(profile)}>
                    <Avatar
                      imageSrc={avatarHttpUrl}
                      name={name}
                      bgColor={`var(--usercolor${getIdentifierColorNumber(profile.userId)})`}
                      size="xxs"
                      shape="circle"
                    />
                    <Text className="truncate" variant="b3" weight="medium">
                      {name}
                    </Text>
                  </Chip>
                );
              });
            })()}
          </div>
        </Scroll>
      )}
    </SettingTile>
  );
}
