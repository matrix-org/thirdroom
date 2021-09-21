import React, { useContext } from "react";
import { Redirect, Route, RouteProps, useLocation } from "react-router-dom";
import { ClientContext } from "../matrix/ClientContext";

export function AuthenticatedRoute({ children, ...rest }: RouteProps) {
  const client = useContext(ClientContext);
  const location = useLocation();

  if (client.authenticated) {
    return <Route {...rest}>{children}</Route>;
  } else {
    return (
      <Redirect
        to={{
          pathname: "/login",
          state: { from: location },
        }}
      />
    );
  }
}
