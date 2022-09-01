import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  AbortableOperation,
  Client,
  OidcApi,
  Platform,
  QueryLoginResult,
  QueryOIDCResult,
  URLRouter,
} from "@thirdroom/hydrogen-view-sdk";

import { Text } from "../../atoms/text/Text";
import { Input } from "../../atoms/input/Input";
import { Button } from "../../atoms/button/Button";
import { Label } from "../../atoms/text/Label";
import { SettingTile } from "../components/setting-tile/SettingTile";
import { useHydrogen } from "../../hooks/useHydrogen";
import { Icon } from "../../atoms/icon/Icon";
import PlanetIC from "../../../../res/ic/planet.svg";
import "./LoginView.css";
import { useDebounce } from "../../hooks/useDebounce";
import { Dots } from "../../atoms/loading/Dots";

function useQueryHomeserver(client: Client, homeserver: string) {
  const queryRef = useRef<AbortableOperation<QueryLoginResult>>();
  const [data, setData] = useState<{
    homeserver: string;
    result: undefined | QueryLoginResult;
    error: string | undefined;
    loading: boolean;
  }>({
    homeserver,
    result: undefined,
    error: undefined,
    loading: false,
  });

  const queryCallback = useCallback(
    async (homeserver: string) => {
      setData({
        homeserver,
        result: undefined,
        loading: true,
        error: undefined,
      });
      const queryOperation = client.queryLogin(homeserver);
      queryRef.current = queryOperation;
      try {
        const result = await queryOperation.result;
        setData({
          homeserver,
          result,
          loading: false,
          error: undefined,
        });
      } catch (e: any) {
        setData({
          homeserver,
          result: undefined,
          loading: false,
          error: e.name === "AbortError" ? undefined : "Unable to find homeserver.",
        });
      }
      if (queryRef.current === queryOperation) {
        queryRef.current = undefined;
      }
    },
    [client]
  );

  const debouncedCallback = useDebounce(queryCallback, { wait: 400 });

  useEffect(() => {
    queryRef.current?.abort();
    queryRef.current = undefined;
    queryCallback(homeserver);
  }, [homeserver, queryCallback]);

  const queryHomeserver = (homeserver: string) => {
    queryRef.current?.abort();
    queryRef.current = undefined;
    if (homeserver === "") return;
    debouncedCallback(homeserver);
  };

  return { ...data, queryHomeserver };
}

async function startOIDCLogin(
  platform: Platform,
  urlCreator: URLRouter,
  homeserver: string,
  oidc: QueryOIDCResult,
  oidcApi: OidcApi
) {
  const { openUrl, settingsStorage } = platform;
  const deviceScope = oidcApi.generateDeviceScope();
  const param = oidcApi.generateParams({
    scope: `openid urn:matrix:org.matrix.msc2967.client:api:* ${deviceScope}`,
    redirectUri: urlCreator.createOIDCRedirectURL(),
  });
  const clientId = await oidcApi.clientId();
  await Promise.all([
    settingsStorage.setInt(`oidc_${param.state}_started_at`, Date.now()),
    param.nonce ? settingsStorage.setString(`oidc_${param.state}_nonce`, param.nonce) : Promise.resolve(),
    param.codeVerifier
      ? settingsStorage.setString(`oidc_${param.state}_code_verifier`, param.codeVerifier)
      : Promise.resolve(),
    settingsStorage.setString(`oidc_${param.state}_redirect_uri`, param.redirectUri),
    settingsStorage.setString(`oidc_${param.state}_homeserver`, homeserver),
    settingsStorage.setString(`oidc_${param.state}_issuer`, oidc.issuer),
    settingsStorage.setString(`oidc_${param.state}_client_id`, clientId),
    settingsStorage.setString(`oidc_${param.state}_account_management_url`, oidc.account),
  ]);

  const link = await oidcApi.authorizationEndpoint(param);
  openUrl(link);
}

export function LoginView() {
  const { platform, urlRouter, login, client } = useHydrogen();
  const [authenticating, setAuthenticating] = useState(false);
  const [oidcError, setOidcError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  const { homeserver, loading, error, result, queryHomeserver } = useQueryHomeserver(
    client,
    platform.config.defaultHomeServer
  );
  useEffect(() => {
    if (!formRef.current) return;
    const form = formRef.current.elements as typeof formRef.current.elements & {
      homeserver: HTMLInputElement;
    };
    form.homeserver.value = platform.config.defaultHomeServer;
  }, [platform]);

  const handleHomeserverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const hs = event.target.value.trim();
    setOidcError(undefined);
    queryHomeserver(hs);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!result) return;

    const form = event.currentTarget.elements as typeof event.currentTarget.elements & {
      homeserver: HTMLInputElement;
      username: HTMLInputElement;
      password: HTMLInputElement;
    };
    if (form.homeserver.value !== homeserver) {
      return;
    }

    let loginMethod;
    setAuthenticating(true);
    setOidcError(undefined);

    if (result.oidc) {
      const { issuer } = result.oidc;
      const oidcApi = new OidcApi({
        issuer,
        clientConfigs: platform.config.oidc.clientConfigs,
        request: platform.request,
        encoding: platform.encoding,
        crypto: platform.crypto,
        urlCreator: urlRouter,
      });
      try {
        await oidcApi.registration();
        await oidcApi.metadata();
        await startOIDCLogin(platform, urlRouter, result.homeserver, result.oidc, oidcApi);
      } catch (e) {
        console.error(e);
        setOidcError("This client is not registered by the homeserver.");
      }

      setAuthenticating(false);
      return;
    } else if (result.password) {
      const username = form.username.value.trim();
      const password = form.password.value;
      if (!username || !password || !result) return;

      loginMethod = result.password(username, password);
    }

    if (!loginMethod) {
      setAuthenticating(false);
      return;
    }
    try {
      await login(loginMethod);
    } catch (error) {
      console.error(error);
    }
    setAuthenticating(false);
  };

  const renderPasswordLogin = () => (
    <>
      <Text variant="s1" weight="bold">
        Login
      </Text>
      <SettingTile
        label={
          <Label color="surface-low" htmlFor="username">
            Username
          </Label>
        }
      >
        <Input name="username" disabled={authenticating} required />
      </SettingTile>
      <SettingTile
        label={
          <Label color="surface-low" htmlFor="password">
            Password
          </Label>
        }
      >
        <Input name="password" type="password" disabled={authenticating} required />
      </SettingTile>
      <Button size="lg" variant="primary" type="submit" disabled={authenticating}>
        {authenticating ? <Dots color="on-primary" /> : "Login"}
      </Button>
    </>
  );

  return (
    <div className="LoginView flex justify-center items-start">
      <div className="LoginView__card grow flex flex-column gap-xl">
        <div className="flex items-center gap-sm">
          <Icon src={PlanetIC} size="lg" />
          <Text variant="h2" weight="bold">
            Third Room
          </Text>
        </div>
        <form ref={formRef} className="LoginView__form flex flex-column gap-md" onSubmit={handleLogin}>
          <SettingTile
            label={
              <Label color="surface-low" htmlFor="homeserver">
                Homeserver
              </Label>
            }
          >
            <Input
              defaultValue={platform.config.defaultHomeServer}
              name="homeserver"
              disabled={authenticating}
              onChange={handleHomeserverChange}
              required
            />
          </SettingTile>
          {oidcError && (
            <Text color="danger" variant="b2">
              {oidcError}
            </Text>
          )}
          {loading && (
            <div className="flex items-center gap-sm">
              <Dots />
              <Text>Looking for homeserver</Text>
            </div>
          )}
          {result &&
            (result.oidc || result.password ? (
              <>
                {result.oidc && !oidcError ? (
                  <Button size="lg" variant="primary" type="submit" disabled={authenticating}>
                    {authenticating ? <Dots color="on-primary" /> : "Continue"}
                  </Button>
                ) : (
                  result.password && renderPasswordLogin()
                )}
              </>
            ) : (
              <Text color="danger" variant="b2">
                This client is not supported by the homeserver.
              </Text>
            ))}
          {error && (
            <Text color="danger" variant="b2">
              {error}
            </Text>
          )}
        </form>
      </div>
    </div>
  );
}
