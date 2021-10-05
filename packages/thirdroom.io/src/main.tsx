import "./global.css";
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Switch, Route, useLocation } from "react-router-dom";
import {
  DashboardPage,
  AuthenticatedRoute,
  ClientContextProvider,
  RoomPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  CreateRoomPage,
} from "@thirdroom/core";

function Routes() {
  return (
    <HashRouter>
      <Switch>
        <AuthenticatedRoute path="/" exact>
          <DashboardPage />
        </AuthenticatedRoute>
        <Route path="/login" exact>
          <LoginPage />
        </Route>
        <Route path="/register" exact>
          <RegisterPage />
        </Route>
        <Route path="/profile" exact>
          <ProfilePage />
        </Route>
        <Route path="/create" exact>
          <CreateRoomPage />
        </Route>
        <Route path="/room/:roomId*">
          <RoomPage />
        </Route>
        <Route path="*">
          <NoMatch />
        </Route>
      </Switch>
    </HashRouter>
  );
}

function NoMatch() {
  const location = useLocation();
  console.log(location);
  return <div>No Match</div>;
}

ReactDOM.render(
  <React.StrictMode>
    <ClientContextProvider>
      <Routes />
    </ClientContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
