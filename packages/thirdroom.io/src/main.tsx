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
  MatrixRoomManager,
} from "@thirdroom/core";
import { HomePage } from "./HomePage";

const roomManager = new MatrixRoomManager();

function Routes() {
  return (
    <HashRouter>
      <Switch>
        <AuthenticatedRoute
          redirectAuthed
          redirectPath="/dashboard"
          path="/"
          exact
          component={HomePage}
        />
        <AuthenticatedRoute path="/dashboard" component={DashboardPage} />
        <Route path="/login" exact component={LoginPage} />
        <Route path="/register" exact component={RegisterPage} />
        <Route
          path="/room/:roomId*"
          render={() => <RoomPage roomManager={roomManager} />}
        />
        <Route path="*" component={NotFoundPage} />
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
