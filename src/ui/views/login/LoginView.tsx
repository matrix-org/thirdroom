import { FormEvent } from "react";
import { useState } from "react";

import { Text } from "../../atoms/text/Text";
import { Input } from "../../atoms/input/Input";
import { Button } from "../../atoms/button/Button";
import { Label } from "../../atoms/text/Label";
import { SettingTile } from "../components/setting-tile/SettingTile";
import { useHydrogen } from "../../hooks/useHydrogen";
import { Icon } from "../../atoms/icon/Icon";
import PlanetIC from "../../../../res/ic/planet.svg";
import "./LoginView.css";

export function LoginView() {
  const { platform, login } = useHydrogen();
  const [authenticating, setAuthenticating] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget.elements as typeof event.currentTarget.elements & {
      homeserver: HTMLInputElement;
      username: HTMLInputElement;
      password: HTMLInputElement;
    };

    setAuthenticating(true);

    try {
      await login(form.homeserver.value, form.username.value, form.password.value);
      setAuthenticating(false);
    } catch (error) {
      console.error(error);
      setAuthenticating(false);
    }
  };

  if (authenticating) {
    return <p>Login in progress...</p>;
  }

  return (
    <div className="LoginView flex justify-center items-center">
      <div className="LoginView__card grow flex flex-column gap-xl">
        <div className="flex items-center gap-sm">
          <Icon src={PlanetIC} size="lg" />
          <Text variant="h2" weight="bold">
            Third Room
          </Text>
        </div>
        <form className="LoginView__form flex flex-column gap-md" onSubmit={handleLogin}>
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
              placeholder="matrix.org"
              required
            />
          </SettingTile>
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
            <Input name="username" required />
          </SettingTile>
          <SettingTile
            label={
              <Label color="surface-low" htmlFor="password">
                Password
              </Label>
            }
          >
            <Input name="password" type="password" required />
          </SettingTile>
          <Button variant="primary" type="submit">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
