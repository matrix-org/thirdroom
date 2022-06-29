import { HomeServerApi } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { useAsync } from "./useAsync";

export function useSearchProfile(hsApi: HomeServerApi, limit?: number) {
  const [searchTerm, setSearchTerm] = useState<string>();

  const { loading, error, value } = useAsync(() => {
    if (typeof searchTerm !== "string" || searchTerm.trim() === "") {
      return Promise.resolve(undefined);
    }
    return hsApi.searchProfile(searchTerm, limit).response();
  }, [hsApi, searchTerm, limit]);

  return { loading, error, value, setSearchTerm };
}
