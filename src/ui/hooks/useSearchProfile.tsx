import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { useAsync } from "./useAsync";

export interface UserProfile {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface SearchProfileResult {
  limited: boolean;
  results: UserProfile[];
}

export function useSearchProfile(session: Session, limit?: number) {
  const hsApi = session.hsApi;
  const [searchTerm, setSearchTerm] = useState<string>();

  const { loading, error, value } = useAsync<SearchProfileResult | undefined>(async () => {
    if (typeof searchTerm !== "string" || searchTerm.trim() === "") {
      return Promise.resolve(undefined);
    }
    const data = await hsApi.searchProfile(searchTerm, limit).response();
    if (data.limited === undefined) return undefined;
    const searchData: SearchProfileResult = {
      limited: data.limited,
      results: [],
    };
    data?.results.forEach((profile: { user_id: string; avatar_url?: string; display_name?: string }) => {
      if (profile.user_id === session.userId) return;
      searchData.results.push({
        userId: profile.user_id,
        avatarUrl: profile.avatar_url,
        displayName: profile.display_name,
      });
    });
    return searchData;
  }, [hsApi, searchTerm, limit]);

  return { loading, error, value, setSearchTerm };
}
