import "./global.css";
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Switch, Route } from "react-router-dom";
import {
  DashboardPage,
  AuthenticatedRoute,
  ClientContextProvider,
  RoomPage,
  LoginPage,
  RegisterPage,
  NotFoundPage,
} from "./ui";
import { HomePage } from "./HomePage";

function Routes() {
  return (
    <HashRouter>
      <Switch>
        <AuthenticatedRoute
          redirectAuthed
          redirectPath="/dashboard"
          path="/"
          exact
        >
          <HomePage />
        </AuthenticatedRoute>
        <AuthenticatedRoute path="/dashboard">
          <DashboardPage />
        </AuthenticatedRoute>
        <Route path="/login" exact>
          <LoginPage />
        </Route>
        <Route path="/register" exact>
          <RegisterPage />
        </Route>
        <Route path="/room/:roomId*">
          <RoomPage />
        </Route>
        <Route path="*">
          <NotFoundPage />
        </Route>
      </Switch>
    </HashRouter>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <ClientContextProvider>
      <Routes />
    </ClientContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
