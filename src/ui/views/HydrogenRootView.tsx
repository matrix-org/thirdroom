// @refresh reset
import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useMatch } from "react-router-dom";
import {
  Platform,
  Segment,
  Navigation,
  Client,
  Session,
  LoadStatus,
  URLRouter,
  CallIntent,
  ILogger,
  LoginFailure,
} from "@thirdroom/hydrogen-view-sdk";
import downloadSandboxPath from "@thirdroom/hydrogen-view-sdk/download-sandbox.html?url";
import workerPath from "@thirdroom/hydrogen-view-sdk/main.js?url";
import olmWasmPath from "@matrix-org/olm/olm.wasm?url";
import olmJsPath from "@matrix-org/olm/olm.js?url";
import olmLegacyJsPath from "@matrix-org/olm/olm_legacy.js?url";

import { Text } from "../atoms/text/Text";
import { HydrogenContext, HydrogenContextProvider } from "../hooks/useHydrogen";
import { useAsync } from "../hooks/useAsync";
import { useAsyncCallback } from "../hooks/useAsyncCallback";
import { LoadingScreen } from "./components/loading-screen/LoadingScreen";
import { Button } from "../atoms/button/Button";
import { useUserProfile } from "../hooks/useUserProfile";
import { registerThirdroomGlobalVar } from "../../engine/utils/registerThirdroomGlobal";

const defaultHomeServer = "matrix.org";

function allowsChild(parent: Segment, child: Segment) {
  const parentType = parent.type;

  if (parentType === undefined) return ["session", "login"].includes(child.type);
  if (parentType === "session") return ["left-panel"].includes(child.type);
  if (parentType === "left-panel") return ["room"].includes(child.type);
  return false;
}

enum SyncStatus {
  InitialSync = "InitialSync",
  CatchupSync = "CatchupSync",
  Syncing = "Syncing",
  Stopped = "Stopped",
}

class MockRouter {
  attach() {}

  dispose() {}

  pushUrl(url: string) {}

  tryRestoreLastUrl() {
    return false;
  }

  urlForSegments(segments: string[]) {
    return "";
  }

  urlForSegment(type: string, value: any) {
    return "";
  }

  urlUntilSegment(type: string) {
    return "";
  }

  urlForPath(path: string) {
    return "";
  }

  openRoomActionUrl(roomId: string) {
    return "";
  }

  createSSOCallbackURL() {
    return "";
  }

  normalizeUrl() {}
}

interface HydrogenInstance {
  client: Client;
  platform: Platform;
  navigation: Navigation;
  containerEl: HTMLElement;
  urlRouter: URLRouter;
  logger: ILogger;
}

let hydrogenInstance: HydrogenInstance;

function initHydrogen() {
  if (hydrogenInstance) {
    return hydrogenInstance;
  }

  // Container element used by Hydrogen for downloads etc.
  const container = document.createElement("div");
  container.id = "hydrogen-root";
  document.body.append(container);

  const assetPaths = {
    downloadSandbox: downloadSandboxPath,
    worker: workerPath,
    olm: {
      wasm: olmWasmPath,
      legacyBundle: olmLegacyJsPath,
      wasmBundle: olmJsPath,
    },
  };

  const config = {
    defaultHomeServer,
  };

  const options = {
    development: import.meta.env.DEV,
  };

  const platform = new Platform({ container, assetPaths, config, options });

  const navigation = new Navigation(allowsChild);
  platform.setNavigation(navigation);

  const client = new Client(platform);

  hydrogenInstance = {
    client,
    platform,
    navigation,
    containerEl: container,
    urlRouter: new MockRouter() as unknown as URLRouter,
    logger: platform.logger,
  };

  registerThirdroomGlobalVar("hydrogen", hydrogenInstance);

  return hydrogenInstance;
}

async function loadSession(client: Client, session: Session) {
  await client.loadStatus.waitFor((loadStatus: LoadStatus) => {
    const isCatchupSync = loadStatus === LoadStatus.FirstSync && client.sync.status.get() === SyncStatus.CatchupSync;

    return (
      isCatchupSync ||
      loadStatus === LoadStatus.LoginFailed ||
      loadStatus === LoadStatus.Error ||
      loadStatus === LoadStatus.Ready
    );
  });

  const loadStatus = client.loadStatus.get();

  if (loadStatus === LoadStatus.Error || loadStatus === LoadStatus.LoginFailed) {
    await client.startLogout(client.sessionId);
  }

  await session.callHandler.loadCalls("m.room" as CallIntent);
}

function loginFailureToMsg(loginFailure: LoginFailure) {
  if (loginFailure === LoginFailure.Connection) return "Connection timeout. Please try again.";
  if (loginFailure === LoginFailure.Credentials) return "Invalid password. Please try again.";
  if (loginFailure === LoginFailure.Unknown) return "Unknown error. Please try again.";
}

export function HydrogenRootView() {
  const [session, setSession] = useState<Session>();

  const [{ client, containerEl, platform, navigation, urlRouter, logger }] = useState(initHydrogen);

  useEffect(() => {
    return () => {
      client.dispose();
      containerEl.remove();
    };
  }, [client, containerEl]);

  const { loading: loadingInitialSession, error: initialSessionLoadError } = useAsync(async () => {
    const availableSessions = await platform.sessionInfoStorage.getAll();

    if (availableSessions.length === 0) {
      setSession(undefined);
      return;
    }

    const sessionId = availableSessions[0].id;
    await client.startWithExistingSession(sessionId);

    if (client.session) {
      try {
        await loadSession(client, client.session);
      } catch (error) {
        console.error("Error loading initial session", error);
      }
    }

    setSession(client.session);
  }, [platform, client]);

  const {
    loading: loggingIn,
    error: errorLoggingIn,
    callback: login,
  } = useAsyncCallback<(homeserverUrl: string, username: string, password: string) => Promise<void>, void>(
    async (homeserverUrl, username, password) => {
      const loginOptions = await client.queryLogin(homeserverUrl).result;

      // TODO: Handle other login types

      await client.startWithLogin(loginOptions.password(username, password));

      if (client.session) {
        await loadSession(client, client.session);
        setSession(client.session);
      } else {
        throw Error("Unknown error logging in.");
      }
    },
    [client]
  );

  const {
    loading: loggingOut,
    error: errorLoggingOut,
    callback: logout,
  } = useAsyncCallback<() => Promise<void>, void>(async () => {
    if (client && client.session) {
      await client.startLogout(client.session.sessionInfo.id);
      client.loadStatus.set(LoadStatus.NotLoading);
      setSession(undefined);
    }
  }, [client, session]);

  const profileRoom = useUserProfile(client, session);

  const context = useMemo<HydrogenContext>(
    () => ({
      client,
      platform,
      navigation,
      containerEl,
      urlRouter,
      logger,
      session,
      profileRoom,
      login,
      logout,
    }),
    [client, platform, navigation, containerEl, urlRouter, logger, session, profileRoom, login, logout]
  );

  const loginPathMatch = useMatch({ path: "/login" });
  const hasProfileRoom = session && profileRoom;

  const loading = loadingInitialSession || loggingIn || loggingOut || (session && !profileRoom);
  const error = initialSessionLoadError || errorLoggingIn || errorLoggingOut;

  if (loading) {
    return (
      <LoadingScreen>
        <Text variant="b1" weight="semi-bold">
          Loading...
        </Text>
      </LoadingScreen>
    );
  }

  if (error) {
    return (
      <LoadingScreen className="gap-md">
        <Text variant="b1" weight="semi-bold">
          {errorLoggingIn ? loginFailureToMsg(client.loginFailure) : error.message}
        </Text>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </LoadingScreen>
    );
  }

  if (!session && !loginPathMatch && !hasProfileRoom) {
    return <Navigate to="/login" />;
  } else if (session && loginPathMatch && hasProfileRoom) {
    return <Navigate to="/" />;
  }

  return (
    <HydrogenContextProvider value={context}>
      <Outlet />
    </HydrogenContextProvider>
  );
}
