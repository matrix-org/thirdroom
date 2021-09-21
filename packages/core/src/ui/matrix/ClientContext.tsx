import matrix, { ICreateClientOpts, MatrixClient } from "@robertlong/matrix-js-sdk";
import React, { createContext, PropsWithChildren, useMemo, useState, useCallback, useEffect } from "react";

function waitForSync(client: MatrixClient) {
  return new Promise<void>((resolve) => {
    const onSync = (state: string) => {
      if (state === "PREPARED") {
        resolve();
        client.removeListener("sync", onSync);
      }
    };
    client.on("sync", onSync);
  });
}

async function initClient(clientOptions: ICreateClientOpts, guest?: boolean) {
  const client = matrix.createClient(clientOptions);

  if (guest) {
    client.setGuest(true);
  }

  await client.startClient({
    // dirty hack to reduce chance of gappy syncs
    // should be fixed by spotting gaps and backpaginating
    initialSyncLimit: 50,
  });

  await waitForSync(client);

  return client;
}

interface ClientContextProps {
  client?: MatrixClient
  loading: boolean
  authenticated: boolean,
  error?: Error,
  login: (userName: string, password: string) => Promise<void>
  registerGuest: (displayName: string) => Promise<void>
  register: (userName: string, password: string) => Promise<void>
  logout: () => void
}

export const ClientContext = createContext<ClientContextProps>({
  client: undefined,
  loading: false,
  authenticated: false,
  error: undefined,
  login: (username: string, password: string) => Promise.reject("uninitialized"),
  registerGuest: (displayName: string) => Promise.reject("uninitialized"),
  register: (username: string, password: string) => Promise.reject("uninitialized"),
  logout: () => { throw new Error("uninitialized") },
});

interface ClientContextProviderState {
  client?: MatrixClient
  loading: boolean
  authenticated: boolean
}

const { protocol, host } = window.location;
// Assume homeserver is hosted on same domain (proxied in development by vite)
const homeserverUrl = `${protocol}//${host}`;

export function ClientContextProvider({ children }: PropsWithChildren<{}>) {
  const [state, setState] = useState<ClientContextProviderState>({ loading: true, authenticated: false });

  useEffect(() => {
    async function restore() {
      try {
        const authStore = localStorage.getItem("matrix-auth-store");

        if (authStore) {
          const { user_id, device_id, access_token } = JSON.parse(authStore);

          const client = await initClient({
            baseUrl: homeserverUrl,
            accessToken: access_token,
            userId: user_id,
            deviceId: device_id,
          });

          localStorage.setItem(
            "matrix-auth-store",
            JSON.stringify({ user_id, device_id, access_token })
          );

          return client;
        }
      } catch (err) {
        localStorage.removeItem("matrix-auth-store");
        throw err;
      }
    }
    
    restore().then((client) => {
      if (client) {
        setState({ client, loading: false, authenticated: true });
      } else {
        setState({ client: undefined, loading: false, authenticated: false });
      }
    }).catch(() => {
      setState({ client: undefined, loading: false, authenticated: false });
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const registrationClient = matrix.createClient(homeserverUrl);

      const { user_id, device_id, access_token } =
        await registrationClient.loginWithPassword(username, password);

      const client = await initClient({
        baseUrl: homeserverUrl,
        accessToken: access_token,
        userId: user_id,
        deviceId: device_id,
      });

      localStorage.setItem(
        "matrix-auth-store",
        JSON.stringify({ user_id, device_id, access_token })
      );

      setState({ client, loading: false, authenticated: true });
    } catch (err) {
      localStorage.removeItem("matrix-auth-store");
      setState({ client: undefined, loading: false, authenticated: false });
      throw err;
    }
  }, []);

  const registerGuest = useCallback(async (displayName: string) => {
    try {
      const registrationClient = matrix.createClient(homeserverUrl);

      const { user_id, device_id, access_token } =
        await registrationClient.registerGuest({});

      const client = await initClient({
        baseUrl: homeserverUrl,
        accessToken: access_token,
        userId: user_id,
        deviceId: device_id,
      }, true);

      localStorage.setItem(
        "matrix-auth-store",
        JSON.stringify({ user_id, device_id, access_token })
      );

      setState({ client, loading: false, authenticated: true });
    } catch (err) {
      localStorage.removeItem("matrix-auth-store");
      setState({ client: undefined, loading: false, authenticated: false });
      throw err;
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const registrationClient = matrix.createClient(homeserverUrl);

      const { user_id, device_id, access_token } =
        await registrationClient.register(username, password, null, {
          type: "m.login.dummy",
        });

      const client = await initClient({
        baseUrl: homeserverUrl,
        accessToken: access_token,
        userId: user_id,
        deviceId: device_id,
      });

      localStorage.setItem(
        "matrix-auth-store",
        JSON.stringify({ user_id, device_id, access_token })
      );

      setState({ client, loading: false, authenticated: true });
    } catch (err) {
      localStorage.removeItem("matrix-auth-store");
      setState({ client: undefined, loading: false, authenticated: false });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("matrix-auth-store");
    setState({ client: undefined, loading: false, authenticated: false });
  }, []);

  const context = useMemo(() => ({ ...state, login, registerGuest, register, logout }), [state]);

  if (state.loading) {
    return <div>Loading...</div>;
  }

  return <ClientContext.Provider value={context}>{children}</ClientContext.Provider>;
}