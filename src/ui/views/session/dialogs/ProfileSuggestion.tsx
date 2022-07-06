import { Label } from "../../../atoms/text/Label";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Text } from "../../../atoms/text/Text";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Chip } from "../../../atoms/chip/Chip";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getMxIdUsername } from "../../../utils/matrixUtils";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SearchProfileResult } from "../../../hooks/useSearchProfile";

export function ProfileSuggestion({
  loading,
  searchResult,
  onSelect,
}: {
  loading: boolean;
  onSelect: (userId: string) => void;
  searchResult?: SearchProfileResult;
}) {
  const { session, platform } = useHydrogen(true);
  return (
    <SettingTile label={<Label>Suggestions</Label>}>
      {loading ? (
        <Text variant="b3">Looking for suggestion...</Text>
      ) : !searchResult ? (
        <Text variant="b3">User suggestion will appear here.</Text>
      ) : searchResult.results.length === 0 ? (
        <Text variant="b3">No suggestion found.</Text>
      ) : (
        <Scroll type="hover" orientation="horizontal">
          <div style={{ paddingBottom: "var(--sp-sm)" }} className="flex items-center gap-xs">
            {(() => {
              const profiles = searchResult.results;
              return profiles.map((profile) => {
                const name = profile.displayName ?? getMxIdUsername(profile.userId);
                const avatarHttpUrl = profile.avatarUrl
                  ? getAvatarHttpUrl(profile.avatarUrl, 16, platform, session.mediaRepository)
                  : undefined;
                return (
                  <Chip key={profile.userId} onClick={(e) => onSelect(profile.userId)}>
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
