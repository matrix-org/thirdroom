import React, { useCallback, useContext } from "react";
import { AuthForm } from "../forms/AuthForm";
import { ClientContext } from "../matrix/ClientContext";
import { useAuthRedirect } from "../router/useAuthRedirect";
import { Link } from "react-router-dom";

export function RegisterPage() {
  const { register } = useContext(ClientContext);
  const redirect = useAuthRedirect();

  const onSubmit = useCallback(
    async ({ userName, password }: { userName: string; password: string }) => {
      await register(userName, password);
      redirect();
    },
    []
  );

  return (
    <div className="register-container">
      <div className="container-content">
        <h2>Register</h2>
        <AuthForm
          submitLabel="Register"
          submittingLabel="Registering..."
          onSubmit={onSubmit}
        />
        <Link to="/login">Login</Link>
      </div>
    </div>
  );
}
