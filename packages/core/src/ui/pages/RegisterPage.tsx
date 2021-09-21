import React, { useCallback, useContext } from "react";
import { AuthForm } from "../forms/AuthForm";
import { ClientContext } from "../matrix/ClientContext";
import { useRedirectFrom } from "../router/useRedirectFrom";
import { Link } from "react-router-dom";

export function RegisterPage() {
  const { register } = useContext(ClientContext);
  const redirect = useRedirectFrom();

  const onSubmit = useCallback(
    async ({ userName, password }: { userName: string; password: string }) => {
      await register(userName, password);
      redirect();
    },
    []
  );

  return (
    <div>
      <h1>Register</h1>
      <AuthForm submitLabel="Register" submittingLabel="Registering..."  onSubmit={onSubmit} />
      <Link to="/login">Login</Link>
    </div>
  );
}
