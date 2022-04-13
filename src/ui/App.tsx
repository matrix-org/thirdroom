import { Route, Routes } from "react-router-dom";

import "./App.css";

import { HydrogenRootView } from "./views/HydrogenRootView";
import { LoginView } from "./views/login/LoginView";
import { SessionView } from "./views/session/SessionView";
import { WorldView } from "./views/session/world/WorldView";
import { HomeView } from "./views/session/home/HomeView";

export function App() {
  return (
    <Routes>
      <Route element={<HydrogenRootView />}>
        <Route path="/login" element={<LoginView />} />
        <Route element={<SessionView />}>
          <Route path="world/:worldId" element={<WorldView />} />
          <Route path="/" element={<HomeView />} />
        </Route>
      </Route>
    </Routes>
  );
}
