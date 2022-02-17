import React, { useContext } from "react";
import { Redirect, Route, RouteProps, useLocation } from "react-router-dom";
import { ClientContext } from "../matrix/ClientContext";
import { useSetAuthRedirectPath, AuthRedirectPath } from "./useAuthRedirect";

interface AuthenticatedRouteProps extends RouteProps {
  redirectAuthed?: boolean;
  redirectPath?: AuthRedirectPath;
}

export function AuthenticatedRoute({
  children,
  redirectAuthed,
  redirectPath = "/login",
  ...rest
}: AuthenticatedRouteProps) {
  const { authenticated } = useContext(ClientContext);
  const location = useLocation();

  useSetAuthRedirectPath(
    redirectPath && !redirectAuthed ? location : undefined
  );

  if (
    (authenticated && !redirectAuthed) ||
    (!authenticated && redirectAuthed)
  ) {
    return <Route {...rest}>{children}</Route>;
  } else {
    return <Redirect to={redirectPath} />;
  }
}
