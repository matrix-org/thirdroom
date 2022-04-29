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
} from "@thirdroom/hydrogen-view-sdk";
import downloadSandboxPath from "@thirdroom/hydrogen-view-sdk/download-sandbox.html?url";
import workerPath from "@thirdroom/hydrogen-view-sdk/main.js?url";
import olmWasmPath from "@matrix-org/olm/olm.wasm?url";
import olmJsPath from "@matrix-org/olm/olm.js?url";
import olmLegacyJsPath from "@matrix-org/olm/olm_legacy.js?url";

import { Text } from "../atoms/text/Text";
import { HydrogenContext, HydrogenContextProvider } from "../hooks/useHydrogen";
import { useAsync } from "../hooks/useAsync";

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

  const global = window as unknown as any;

  if (!global.thirdroom) {
    global.thirdroom = {};
  }

  global.thirdroom.hydrogen = hydrogenInstance;

  return hydrogenInstance;
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

  const {
    loading: loadingInitialSession,
    error: initialSessionLoadError,
    value: initialSession,
  } = useAsync(async () => {
    const availableSessions = await platform.sessionInfoStorage.getAll();

    if (availableSessions.length === 0) {
      return;
    }

    const sessionId = availableSessions[0].id;

    await client.startWithExistingSession(sessionId);

    return client.session;
  }, [platform, client]);

  const currentSession = session || initialSession;

  const { loading: loadingClient, error: clientLoadError } = useAsync(async () => {
    if (!currentSession) {
      return;
    }

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
      try {
        await client.startLogout(client.sessionId);
      } catch (error) {
        console.error(error);
        setSession(undefined);
      }
    }

    await currentSession.callHandler.loadCalls("m.room" as CallIntent);
  }, [client, currentSession]);

  const context = useMemo<HydrogenContext>(
    () => ({
      client,
      platform,
      navigation,
      containerEl,
      urlRouter,
      logger,
      session: currentSession,
      setSession,
    }),
    [client, platform, navigation, containerEl, urlRouter, logger, currentSession, setSession]
  );

  const loginPathMatch = useMatch({ path: "/login" });

  const loading = loadingInitialSession || loadingClient;
  const error = initialSessionLoadError || clientLoadError;

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

  if (!currentSession && !loginPathMatch) {
    return <Navigate to="/login" />;
  } else if (currentSession && loginPathMatch) {
    return <Navigate to="/" />;
  }

  return (
    <HydrogenContextProvider value={context}>
      <Outlet />
    </HydrogenContextProvider>
  );
}
