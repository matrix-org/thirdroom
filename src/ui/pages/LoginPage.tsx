import React, { useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthForm } from "../forms/AuthForm";
import { ClientContext } from "../matrix/ClientContext";
import { useAuthRedirect } from "../router/useAuthRedirect";

export function LoginPage() {
  const { login } = useContext(ClientContext);
  const redirect = useAuthRedirect();

  const onSubmit = useCallback(
    async ({ userName, password }: { userName: string; password: string }) => {
      await login(userName, password);
      redirect();
    },
    []
  );

  return (
    <div className="login-container">
      <div className="container-content">
        <h2>Login</h2>
        <AuthForm
          submitLabel="Login"
          submittingLabel="Logging in..."
          onSubmit={onSubmit}
        />
        <Link to="/register">Register Account</Link>
      </div>
    </div>
  );
}
