import "./global.css";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { DashboardPage, AuthenticatedRoute, ClientContextProvider, RoomPage, LoginPage, RegisterPage, ProfilePage, CreateRoomPage } from "@thirdroom/core";
function Routes() {
  return (
    <BrowserRouter>
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
        <Route path="/room/:roomId" exact>
          <RoomPage />
        </Route>
      </Switch>
    </BrowserRouter>
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
