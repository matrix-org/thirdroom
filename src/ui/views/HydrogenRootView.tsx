// @refresh reset
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
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
  OidcApi,
  OIDCLoginMethod,
  ILoginMethod,
  ISessionInfo,
} from "@thirdroom/hydrogen-view-sdk";
import downloadSandboxPath from "@thirdroom/hydrogen-view-sdk/download-sandbox.html?url";
import workerPath from "@thirdroom/hydrogen-view-sdk/main.js?url";
import olmWasmPath from "@matrix-org/olm/olm.wasm?url";
import olmJsPath from "@matrix-org/olm/olm.js?url";
import olmLegacyJsPath from "@matrix-org/olm/olm_legacy.js?url";

import { Text } from "../atoms/text/Text";
import { HydrogenContext, HydrogenContextProvider } from "../hooks/useHydrogen";
import { useAsyncCallback } from "../hooks/useAsyncCallback";
import { LoadingScreen } from "./components/loading-screen/LoadingScreen";
import { Button } from "../atoms/button/Button";
import { useUserProfile } from "../hooks/useUserProfile";
import { registerThirdroomGlobalFn, registerThirdroomGlobalVar } from "../../engine/utils/registerThirdroomGlobal";
import { CoverScreen } from "./components/cover-screen/CoverScreen";
import { downloadFile } from "../../engine/utils/downloadFile";
import configData from "../../../config.json";

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

  createOIDCRedirectURL() {
    return window.location.origin;
  }

  absoluteAppUrl() {
    return window.location.origin;
  }

  absoluteUrlForAsset(asset: string) {
    return new URL("/assets/" + asset, window.location.origin).toString();
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

  const oidcClientId = document.location.hostname === "thirdroom.io" ? "thirdroom" : "thirdroom_dev";
  const oidcUris = ((): string[] => {
    if (document.location.hostname === "thirdroom.io") {
      return ["https://thirdroom.io"];
    }

    const { protocol, hostname, port } = document.location;
    return [`${protocol}//${hostname}${port ? `:${port}` : ""}`];
  })();

  const config = { ...configData };
  config.oidc.clientConfigs["https://id.thirdroom.io/realms/thirdroom/"] = {
    client_id: oidcClientId,
    uris: oidcUris,
    guestKeycloakIdpHint: "guest",
  };

  const options = {
    development: false, //import.meta.env.DEV,
  };

  const platform = new Platform({ container, assetPaths, config, options });

  const navigation = new Navigation(allowsChild);
  platform.setNavigation(navigation);

  const client = new Client(platform, { deviceName: "Third Room" });

  hydrogenInstance = {
    client,
    platform,
    navigation,
    containerEl: container,
    urlRouter: new MockRouter() as unknown as URLRouter,
    logger: platform.logger,
  };

  registerThirdroomGlobalVar("hydrogen", hydrogenInstance);
  registerThirdroomGlobalFn("openCallLogs", () => {
    const logViewer = window.open("/logviewer", "__blank");

    function onReady() {
      window.removeEventListener("log-viewer-ready", onReady);

      logViewer?.postMessage({
        hydrogenLogs: JSON.parse(
          JSON.stringify({
            items: Array.from((platform.logger as any)._openItems).map((i: any) =>
              i.serialize(undefined, undefined, false)
            ),
          })
        ),
      });
    }

    window.addEventListener("log-viewer-ready", onReady);
  });
  registerThirdroomGlobalFn("downloadCallLogs", () => {
    const logs = JSON.stringify({
      items: Array.from((platform.logger as any)._openItems).map((i: any) => i.serialize(undefined, undefined, false)),
    });
    downloadFile(logs, "thirdroom-call-logs.json", "application/json");
  });

  return hydrogenInstance;
}

function getSessionInfo(): ISessionInfo | undefined {
  const sessionsJson = localStorage.getItem("hydrogen_sessions_v1");
  if (sessionsJson) {
    const sessions = JSON.parse(sessionsJson);
    if (Array.isArray(sessions)) {
      return sessions[0];
    }
  }
  return undefined;
}

async function waitToLoadClient(client: Client) {
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
    throw new Error(loginFailureToMsg(client.loginFailure));
  }
}

function loginFailureToMsg(loginFailure: LoginFailure) {
  if (loginFailure === LoginFailure.Connection) return "Connection timeout. Please try again.";
  if (loginFailure === LoginFailure.Credentials) return "Invalid credentials. Please try again.";
  if (loginFailure === LoginFailure.Unknown) return "Unknown error. Please try again.";
}

async function loadClient(client: Client, sessionId: string): Promise<Session | undefined> {
  try {
    await waitToLoadClient(client);
    if (client.session) {
      await client.session.callHandler.loadCalls("m.room" as CallIntent);
      return client.session;
    }
    await client.startLogout(sessionId);
    localStorage.clear();
  } catch (error) {
    localStorage.clear();
    throw error;
  }
  return undefined;
}

async function getOidcLoginMethod(platform: Platform, urlCreator: URLRouter, state: string, code: string) {
  const { settingsStorage } = platform;
  const storageKeys = [
    `oidc_${state}_nonce`,
    `oidc_${state}_code_verifier`,
    `oidc_${state}_redirect_uri`,
    `oidc_${state}_homeserver`,
    `oidc_${state}_issuer`,
    `oidc_${state}_client_id`,
    `oidc_${state}_account_management_url`,
  ];
  const [nonce, codeVerifier, redirectUri, homeserver, issuer, clientId, accountManagementUrl] = await Promise.all(
    storageKeys.map((key) => settingsStorage.getString(key))
  );
  settingsStorage.remove(`oidc_${state}_started_at`);
  storageKeys.forEach((key) => settingsStorage.remove(key));

  if (!nonce || !codeVerifier || !redirectUri || !homeserver || !issuer || !clientId || !accountManagementUrl) {
    return;
  }

  return new OIDCLoginMethod({
    oidcApi: new OidcApi({
      issuer,
      clientConfigs: platform.config.oidc.clientConfigs,
      clientId,
      urlCreator,
      request: platform.request,
      encoding: platform.encoding,
      crypto: platform.crypto,
    }),
    nonce,
    codeVerifier,
    code,
    homeserver,
    redirectUri,
    accountManagementUrl,
  });
}

function useOidcComplete(
  platform: Platform,
  urlRouter: URLRouter,
  login: (loginMethod: ILoginMethod) => Promise<void>
) {
  const navigate = useNavigate();
  const completeOidc = async (state: string, code: string) => {
    const loginMethod = await getOidcLoginMethod(platform, urlRouter, state, code);
    if (!loginMethod) return;
    login(loginMethod);
    navigate("/");
  };
  const location = useLocation();

  if (location.hash !== "") {
    const params = new URLSearchParams(location.hash.slice(1));
    const code = params.get("code");
    const state = params.get("state");
    if (params.get("error")) {
      return params.get("error_description");
    }
    if (code && state) {
      completeOidc(state, code);
    }
  }
  return null;
}
function useSession(client: Client, platform: Platform, urlRouter: URLRouter) {
  const sessionRef = useRef<Session>();
  const session = sessionRef.current ?? undefined;

  const {
    loading: loadingInitialSession,
    error: initialSessionLoadError,
    callback: loadInitialSession,
  } = useAsyncCallback(
    async (sessionInfo: ISessionInfo) => {
      await client.startWithExistingSession(sessionInfo.id);
      sessionRef.current = await loadClient(client, sessionInfo.id);
    },
    [platform, client]
  );

  const {
    loading: loggingIn,
    error: errorLoggingIn,
    callback: login,
  } = useAsyncCallback<(loginMethod: ILoginMethod) => Promise<void>, void>(
    async (loginMethod) => {
      await client.startWithLogin(loginMethod);
      sessionRef.current = await loadClient(client, client.sessionId);
    },
    [client]
  );

  const {
    loading: loggingOut,
    error: errorLoggingOut,
    callback: logout,
  } = useAsyncCallback<() => Promise<void>, void>(async () => {
    if (client && client.session) {
      const availSessions = await platform.sessionInfoStorage.getAll();
      const logoutChain = availSessions.map((session) => client.startLogout(session.id));
      try {
        await Promise.allSettled(logoutChain);
      } catch (err) {
        console.error(err);
      }
      localStorage.clear();

      client.loadStatus.set(LoadStatus.NotLoading);
      sessionRef.current = undefined;
    }
  }, [client, session]);

  const oidcCompleteError = useOidcComplete(platform, urlRouter, login);
  const profileRoom = useUserProfile(client, session);

  const loading = loadingInitialSession || loggingIn || loggingOut || (session && !profileRoom);
  const error = initialSessionLoadError || errorLoggingIn || errorLoggingOut;
  const errorMsg = oidcCompleteError ?? error?.message;

  return {
    session,
    profileRoom,
    loadInitialSession,
    login,
    logout,
    loading,
    errorMsg,
  };
}

export function HydrogenRootView() {
  const sessionInfo = getSessionInfo();

  const [{ client, containerEl, platform, navigation, urlRouter, logger }] = useState(initHydrogen);

  const { session, profileRoom, loadInitialSession, login, logout, loading, errorMsg } = useSession(
    client,
    platform,
    urlRouter
  );

  useEffect(() => {
    return () => {
      client.dispose();
      containerEl.remove();
    };
  }, [client, containerEl]);

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

  const previewPath = useMatch({ path: "/preview" });
  const loginPath = useMatch({ path: "/login" });

  const href = window.location.href;
  const WORLD_PATH_REG = /^\S+(\/world\/(!|#)\S+:\S+)$/;

  if (href.match(WORLD_PATH_REG) && !sessionInfo) {
    localStorage.setItem("on_login_redirect_uri", href);
  }

  if (sessionInfo && !loading && !session && !previewPath) {
    loadInitialSession(sessionInfo);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (errorMsg) {
    return (
      <CoverScreen className="gap-md">
        <Text variant="b1" weight="semi-bold">
          {errorMsg}
        </Text>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </CoverScreen>
    );
  }

  if (!session && !sessionInfo && href.match(WORLD_PATH_REG)) {
    return <Navigate to="/login" replace={true} />;
  }

  if (!previewPath && !loginPath && !session && !sessionInfo) {
    return <Navigate to="/preview" replace={true} />;
  }

  const onLoginRedirectPath = localStorage.getItem("on_login_redirect_uri")?.match(WORLD_PATH_REG)?.[1];
  if (sessionInfo && !previewPath && onLoginRedirectPath) {
    localStorage.removeItem("on_login_redirect_uri");
    return <Navigate to={onLoginRedirectPath} />;
  }

  if (loginPath && sessionInfo) {
    return <Navigate to="/" replace={true} />;
  }

  return (
    <HydrogenContextProvider value={context}>
      <Outlet />
    </HydrogenContextProvider>
  );
}
