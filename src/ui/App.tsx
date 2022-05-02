import { lazy, ReactNode, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import "./App.css";

import { MatrixRootView } from "./views/MatrixRootView";
import { LoginView } from "./views/login/LoginView";
import { SessionView } from "./views/session/SessionView";
import { WorldView } from "./views/session/world/WorldView";
import { HomeView } from "./views/session/home/HomeView";

let storybookRoute: ReactNode = null;

if (import.meta.env.VITE_NETLIFY_DEPLOY_CONTEXT !== "production") {
  const Storybook = lazy(() => import("./storybook/Storybook"));

  storybookRoute = (
    <Route
      path="/storybook"
      element={
        <Suspense fallback="Loading...">
          <Storybook />
        </Suspense>
      }
    />
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<MatrixRootView />}>
        <Route path="/login" element={<LoginView />} />
        <Route element={<SessionView />}>
          <Route path="world/:worldId" element={<WorldView />} />
          <Route path="/" element={<HomeView />} />
        </Route>
      </Route>
      {storybookRoute}
    </Routes>
  );
}
