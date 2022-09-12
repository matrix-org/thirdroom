import { lazy, ReactNode, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useFocusVisible } from "@react-aria/interactions";

import "./App.css";
import "@fontsource/inter/variable.css";

import { HydrogenRootView } from "./views/HydrogenRootView";
import { WorldView } from "./views/session/world/WorldView";
import { HomeView } from "./views/session/home/HomeView";
import { SplashScreen } from "./views/components/splash-screen/SplashScreen";

function FocusOutlineManager() {
  const { isFocusVisible } = useFocusVisible();
  useEffect(() => {
    document.body.style.setProperty("--focus-outline", isFocusVisible ? "var(--tc-surface) solid 2px" : "none");
  }, [isFocusVisible]);
  return <></>;
}

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

const Site = lazy(() => import("./site/Site"));
const LoginView = lazy(() => import("./views/login/LoginView"));
const GLTFViewer = lazy(() => import("./views/gltf-viewer/GLTFViewer"));
const AssetPipeline = lazy(() => import("./views/asset-pipeline/AssetPipeline"));
const SessionView = lazy(() => import("./views/session/SessionView"));

export function App() {
  return (
    <>
      <FocusOutlineManager />
      <Routes>
        <Route element={<HydrogenRootView />}>
          <Route
            path="/preview"
            element={
              <Suspense fallback={<SplashScreen />}>
                <Site />
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={<SplashScreen />}>
                <LoginView />
              </Suspense>
            }
          />
          <Route
            element={
              <Suspense fallback={<SplashScreen />}>
                <SessionView />
              </Suspense>
            }
          >
            <Route path="world/:worldId" element={<WorldView />} />
            <Route path="world/" element={<WorldView />} />
            <Route path="/" element={<HomeView />} />
          </Route>
        </Route>
        <Route
          path="/viewer"
          element={
            <Suspense fallback={<SplashScreen />}>
              <GLTFViewer />
            </Suspense>
          }
        />
        <Route
          path="/pipeline"
          element={
            <Suspense fallback={<SplashScreen />}>
              <AssetPipeline />
            </Suspense>
          }
        />
        {storybookRoute}
      </Routes>
    </>
  );
}
