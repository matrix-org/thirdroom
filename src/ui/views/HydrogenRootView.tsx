import { useEffect, useMemo, useState, useRef } from "react";
import { Navigate, Outlet, useMatch } from "react-router-dom";
import {
  Platform,
  Segment,
  Navigation,
  Client,
  ISessionInfo,
  Session,
  LoadStatus,
  URLRouter,
  ILogger,
} from "hydrogen-view-sdk";
import downloadSandboxPath from "hydrogen-view-sdk/download-sandbox.html?url";
import workerPath from "hydrogen-view-sdk/main.js?url";
import olmWasmPath from "@matrix-org/olm/olm.wasm?url";
import olmJsPath from "@matrix-org/olm/olm.js?url";
import olmLegacyJsPath from "@matrix-org/olm/olm_legacy.js?url";

import { Text } from "../atoms/text/Text";
import { HydrogenContextProvider } from "../hooks/useHydrogen";

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

interface HyrdogenRootViewState {
  loading: boolean;
  availableSessions: ISessionInfo[];
  session?: Session;
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
  const hydrogenRef = useRef<HydrogenRef>();

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

    return () => {
      if (hydrogenRef.current) {
        hydrogenRef.current.client.dispose();
        document.body.removeChild(containerEl);
      }
    };
  }, []);

  const [{ loading, availableSessions, session }, setState] = useState<HyrdogenRootViewState>({
    loading: true,
    availableSessions: [],
    session: undefined,
  });

  useEffect(() => {
    async function loadSessions() {
      const { platform, client } = hydrogenRef.current!;

      const availableSessions = await platform.sessionInfoStorage.getAll();

      if (availableSessions.length > 0) {
        const sessionId = availableSessions[0].id;

        await client.startWithExistingSession(sessionId);

        await client.loadStatus.waitFor((s) => {
          const isCatchupSync = s === LoadStatus.FirstSync && client.sync.status.get() === SyncStatus.CatchupSync;

          return isCatchupSync || s === LoadStatus.LoginFailed || s === LoadStatus.Error || s === LoadStatus.Ready;
        });

        await (client.session as any).callHandler.loadCalls("m.room");

        const loadStatus = client.loadStatus.get();

        if (loadStatus === LoadStatus.Error || loadStatus === LoadStatus.LoginFailed) {
          await client.startLogout(sessionId);
        }
      }

      setState({ loading: false, availableSessions, session: client.session });
    }

    loadSessions().catch((error) => {
      console.error("error loading sessions");
    });
  }, []);

  const context = useMemo(
    () => ({
      ...hydrogenRef.current!,
      availableSessions,
      session,
    }),
    [availableSessions, session]
  );

  const loginPathMatch = useMatch({ path: "/login" });

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: "100%" }}>
        <Text variant="b1" weight="semi-bold">
          Loading...
        </Text>
      </div>
    );
  }

  if (availableSessions.length === 0 && !loginPathMatch) {
    return <Navigate to="/login" />;
  }

  return (
    <HydrogenContextProvider value={context}>
      <Outlet />
    </HydrogenContextProvider>
  );
}
