import { createClient, InteractiveAuth, AuthType, IStageStatus } from "@thirdroom/matrix-js-sdk";
import { useState, useCallback } from "react";

import { initClient } from "../utils/client";
import { useMatrix } from "./useMatrix";

export function useInteractiveLogin() {
  const { setClient } = useMatrix();
  const [state, setState] = useState({ loading: false });

  const auth = useCallback(
    async (baseUrl, username, password) => {
      const authClient = createClient(baseUrl);

      const interactiveAuth = new InteractiveAuth({
        matrixClient: authClient,
        busyChanged(loading) {
          setState((prev) => ({ ...prev, loading }));
        },
        async doRequest(_auth, _background) {
          return authClient.login("m.login.password", {
            identifier: {
              type: "m.id.user",
              user: username,
            },
            password,
          });
        },
        stateUpdated(nextStage: AuthType, status: IStageStatus): void {},
        async requestEmailToken(
          email: string,
          secret: string,
          attempt: number,
          session: string
        ): Promise<{ sid: string }> {
          return { sid: "" };
        },
      });

      const result = await interactiveAuth.attemptAuth();

      const { user_id: userId, access_token: accessToken, device_id: deviceId } = result as unknown as any;

      const client = await initClient({
        baseUrl,
        accessToken,
        userId,
        deviceId,
      });

      localStorage.setItem(
        "thirdroom-auth-store",
        JSON.stringify({
          baseUrl,
          userId,
          accessToken,
          deviceId,
        })
      );

      setClient(client);

      return client;
    },
    [setClient]
  );

  return [state, auth] as [{ loading: boolean }, typeof auth];
}
