import { Label } from "../../../atoms/text/Label";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Text } from "../../../atoms/text/Text";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Chip } from "../../../atoms/chip/Chip";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getMxIdUsername } from "../../../utils/matrixUtils";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { ProfileSearchResult } from "../../../hooks/useSearchProfile";

export function ProfileSuggestion({
  loading,
  searchResult,
  onSelect,
}: {
  loading: boolean;
  onSelect: (userId: string) => void;
  searchResult?: ProfileSearchResult;
}) {
  const { session, platform } = useHydrogen(true);
  return (
    <SettingTile label={<Label>Suggestions</Label>}>
      {loading ? (
        <Text variant="b3">Looking for suggestion...</Text>
      ) : !searchResult?.results ? (
        <Text variant="b3">User suggestion will appear here.</Text>
      ) : searchResult.results.length === 0 ? (
        <Text variant="b3">No suggestion found.</Text>
      ) : (
        <Scroll type="hover" orientation="horizontal">
          <div style={{ paddingBottom: "var(--sp-sm)" }} className="flex items-center gap-xs">
            {(() => {
              const profiles = searchResult.results;
              return profiles.map((profile: { user_id: string; avatar_url?: string; display_name?: string }) => {
                const name = profile.display_name ?? getMxIdUsername(profile.user_id);
                const avatarHttpUrl = profile.avatar_url
                  ? getAvatarHttpUrl(profile.avatar_url, 16, platform, session.mediaRepository)
                  : undefined;
                return (
                  <Chip key={profile.user_id} onClick={(e) => onSelect(profile.user_id)}>
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
              });
            })()}
          </div>
        </Scroll>
      )}
    </SettingTile>
  );
}
