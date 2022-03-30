import React, { useState } from "react";

import { LoginViewModel } from "../../../viewModels/login/LoginViewModel";

interface ILoginView {
  vm: LoginViewModel;
}

export function LoginView({ vm }: ILoginView) {
  const [isAuth, setIsAuth] = useState(false);

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const target = ev.target as typeof ev.target & {
      homeserver: { value: string };
      username: { value: string };
      password: { value: string };
    };
    const { homeserver, username, password } = target;
    setIsAuth(true);
    await vm.login(homeserver.value, username.value, password.value);
    setIsAuth(false);
  };

  if (isAuth) {
    return <p>Login in progress...</p>;
  }

  return (
    <form style={{ height: "100%" }} className="flex flex-column justify-center items-center" onSubmit={handleLogin}>
      <label htmlFor="homeserver">Homeserver</label>
      <input defaultValue={vm.defaultHomeserver} name="homeserver" placeholder="homeserver" required />
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
