import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate, Outlet, useMatch } from "react-router-dom";
import { Platform, Segment, Navigation, Client, Session, LoadStatus, URLRouter, ILogger } from "hydrogen-view-sdk";
import downloadSandboxPath from "hydrogen-view-sdk/download-sandbox.html?url";
import workerPath from "hydrogen-view-sdk/main.js?url";
import olmWasmPath from "@matrix-org/olm/olm.wasm?url";
import olmJsPath from "@matrix-org/olm/olm.js?url";
import olmLegacyJsPath from "@matrix-org/olm/olm_legacy.js?url";

import { Text } from "../atoms/text/Text";
import { HydrogenContextProvider } from "../hooks/useHydrogen";
import { useIsMounted } from "../hooks/useIsMounted";
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

interface HydrogenRef {
  client: Client;
  platform: Platform;
  navigation: Navigation;
  containerEl: HTMLElement;
  urlRouter: URLRouter;
  logger: ILogger;
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

export function HydrogenRootView() {
  const isMounted = useIsMounted();
  const hydrogenRef = useRef<HydrogenRef>();
  const [{ session, initializing }, setState] = useState<{
    session?: Session;
    initializing: boolean;
  }>({
    initializing: true,
    session: undefined,
  });

  const setSession = useCallback((session: Session) => setState((prev) => ({ ...prev, session })), []);

  useEffect(() => {
    // Container element used by Hydrogen for downloads etc.
    const containerEl = document.createElement("div");
    containerEl.id = "hydrogen-root";
    document.body.append(containerEl);

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

    const platform = new Platform(containerEl, assetPaths, config, options);

    const navigation = new Navigation(allowsChild);
    platform.setNavigation(navigation);

    const client = new Client(platform);

    hydrogenRef.current = {
      client,
      platform,
      navigation,
      containerEl,
      urlRouter: new MockRouter() as unknown as URLRouter,
      logger: platform.logger,
    };

    const loadInitialSession = async () => {
      const availableSessions = await platform.sessionInfoStorage.getAll();

      if (availableSessions.length === 0) {
        return;
      }

      const sessionId = availableSessions[0].id;

      await client.startWithExistingSession(sessionId);
    };

    loadInitialSession().finally(() => {
      if (isMounted()) {
        setState({ session: client.session, initializing: false });
      }
    });

    return () => {
      client.dispose();
      document.body.removeChild(containerEl);
    };
  }, [isMounted]);

  const { loading, error } = useAsync(async () => {
    if (!hydrogenRef.current || !session) {
      return undefined;
    }

    const client = hydrogenRef.current.client;

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
        setState((prev) => ({ ...prev, session: undefined }));
      }
    }

    await (session as any).callHandler.loadCalls("m.room");
  }, [session]);

  const loginPathMatch = useMatch({ path: "/login" });

  if (initializing || loading || !hydrogenRef.current) {
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

  if (!session && !loginPathMatch) {
    return <Navigate to="/login" />;
  } else if (session && loginPathMatch) {
    return <Navigate to="/" />;
  }

  return (
    <HydrogenContextProvider value={{ session, setSession, ...hydrogenRef.current }}>
      <Outlet />
    </HydrogenContextProvider>
  );
}
