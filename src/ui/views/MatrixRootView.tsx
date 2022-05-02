// @refresh reset
import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useMatch } from "react-router-dom";
import { MatrixClient } from "@thirdroom/matrix-js-sdk";

import { Text } from "../atoms/text/Text";
import { MatrixContextProvider } from "../hooks/useMatrix";
import { useAsync } from "../hooks/useAsync";
import { initClient, waitForSync } from "../utils/client";

export function MatrixRootView() {
  const [client, setClient] = useState<MatrixClient | undefined>(undefined);

  const loginPathMatch = useMatch({ path: "/login" });

  const {
    loading: loadingInitialClient,
    error: initialClientLoadError,
    value: initialClient,
  } = useAsync(async () => {
    const authStore = localStorage.getItem("thirdroom-auth-store");

    console.log("loading initial client");

    if (!authStore) {
      console.log("no auth store");
      return undefined;
    }

    try {
      const { baseUrl, userId, deviceId, accessToken } = JSON.parse(authStore);

      const client = await initClient({
        baseUrl,
        userId,
        deviceId,
        accessToken,
      });

      console.log("initial client loaded");

      return client;
    } catch (error) {
      console.error("Error parsing auth store", error);
      localStorage.removeItem("thirdroom-auth-store");
      return undefined;
    }
  }, []);

  const currentClient = initialClient || client;

  useEffect(
    () => () => {
      if (currentClient) {
        console.log("stopped");
        currentClient.stopClient();
      }
    },
    [currentClient]
  );

  const { loading: waitingForSync, error: syncWaitError } = useAsync(
    async () => (currentClient ? waitForSync(currentClient) : Promise.resolve()),
    [currentClient]
  );

  console.log(currentClient, loadingInitialClient, waitingForSync);

  const loading = loadingInitialClient || waitingForSync;
  const error = initialClientLoadError || syncWaitError;

  const context = useMemo(() => ({ client: currentClient, setClient }), [currentClient, setClient]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: "100%" }}>
        <Text variant="b1" weight="semi-bold">
          Loading...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center" style={{ height: "100%" }}>
        <Text variant="b1" weight="semi-bold">
          {error.message}
        </Text>
      </div>
    );
  }

  if (!currentClient && !loginPathMatch) {
    return <Navigate to="/login" />;
  } else if (currentClient && loginPathMatch) {
    return <Navigate to="/" />;
  }

  return (
    <MatrixContextProvider value={context}>
      <Outlet />
    </MatrixContextProvider>
  );
}
