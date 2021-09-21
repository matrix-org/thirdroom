import React, { useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthForm } from "../forms/AuthForm";
import { ClientContext } from "../matrix/ClientContext";
import { useRedirectFrom } from "../router/useRedirectFrom";

export function LoginPage() {
  const { login } = useContext(ClientContext);
  const redirect = useRedirectFrom();

  const onSubmit = useCallback(
    async ({ userName, password }: { userName: string; password: string }) => {
      await login(userName, password);
      redirect();
    },
    []
  );

  return (
    <div>
      <h1>Login</h1>
      <AuthForm
        submitLabel="Login"
        submittingLabel="Logging in..."
        onSubmit={onSubmit}
      />
      <Link to="/register">Register Account</Link>
    </div>
  );
}
