import { FormEvent } from "react";
import { useState } from "react";

import { useHydrogen } from "../../hooks/useHydrogen";

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
    <form style={{ height: "100%" }} className="flex flex-column justify-center items-center" onSubmit={handleLogin}>
      <label htmlFor="homeserver">Homeserver</label>
      <input defaultValue={platform.config.defaultHomeServer} name="homeserver" placeholder="homeserver" required />
      <br />
      <label htmlFor="username">Username</label>
      <input name="username" placeholder="username" required />
      <br />
      <label htmlFor="password">Password</label>
      <input name="password" placeholder="password" type="password" required />
      <br />
      <button type="submit">Login</button>
    </form>
  );
}
