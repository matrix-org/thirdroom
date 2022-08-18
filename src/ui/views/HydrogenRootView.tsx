// @refresh reset
import { useEffect, useMemo, useState } from "react";
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

const defaultHomeServer = "matrix.thirdroom.io";

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

  const config = {
    defaultHomeServer,
    oidc: {
      clientConfigs: {
        "https://id.thirdroom.io/realms/thirdroom/": {
          client_id: "thirdroom",
          uris: ["http://localhost:3000", "https://thirdroom.io"],
        },
      },
    },
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
  if (loginFailure === LoginFailure.Credentials) return "Invalid credentials. Please try again.";
  if (loginFailure === LoginFailure.Unknown) return "Unknown error. Please try again.";
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
  } = useAsyncCallback<(loginMethod: ILoginMethod) => Promise<void>, void>(
    async (loginMethod) => {
      await client.startWithLogin(loginMethod);

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

  const navigate = useNavigate();
  const completeOidc = async (state: string, code: string) => {
    const loginMethod = await getOidcLoginMethod(platform, urlRouter, state, code);
    if (!loginMethod) return;
    login(loginMethod);
    navigate("/");
  };

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
  const location = useLocation();
  let oidcError: string | null = null;
  if (location.hash !== "") {
    const params = new URLSearchParams(location.hash.slice(1));
    const code = params.get("code");
    const state = params.get("state");
    if (params.get("error")) {
      oidcError = params.get("error_description");
    }
    if (code && state) {
      completeOidc(state, code);
    }
  }

  const loading = loadingInitialSession || loggingIn || loggingOut || (session && !profileRoom);
  const error = initialSessionLoadError || errorLoggingIn || errorLoggingOut;
  let errorMsg = errorLoggingIn ? loginFailureToMsg(client.loginFailure) : error?.message;
  if (oidcError) errorMsg = oidcError;

  if (loading) {
    return (
      <LoadingScreen>
        <Text variant="b1" weight="semi-bold">
          Loading...
        </Text>
      </LoadingScreen>
    );
  }

  if (errorMsg) {
    return (
      <LoadingScreen className="gap-md">
        <Text variant="b1" weight="semi-bold">
          {errorMsg}
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
