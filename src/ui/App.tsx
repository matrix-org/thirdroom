import { lazy, ReactNode, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useFocusVisible } from "@react-aria/interactions";

import "./App.css";
import "@fontsource/inter/variable.css";

import { HydrogenRootView } from "./views/HydrogenRootView";
import { SplashScreen } from "./views/components/splash-screen/SplashScreen";
import { PageNotFound } from "./views/components/page-not-found/PageNotFound";
import { LoadingScreen } from "./views/components/loading-screen/LoadingScreen";

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
const WorldView = lazy(() => import("./views/session/world/WorldView"));
const HomeView = lazy(() => import("./views/session/home/HomeView"));

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
              <Suspense fallback={<LoadingScreen />}>
                <LoginView />
              </Suspense>
            }
          />
          <Route
            element={
              <Suspense fallback={<LoadingScreen />}>
                <SessionView />
              </Suspense>
            }
          >
            <Route
              path="world/:worldId"
              element={
                <Suspense fallback={<></>}>
                  <WorldView />
                </Suspense>
              }
            />
            <Route
              path="world/"
              element={
                <Suspense fallback={<></>}>
                  <WorldView />
                </Suspense>
              }
            />
            <Route
              path="/"
              element={
                <Suspense fallback={<></>}>
                  <HomeView />
                </Suspense>
              }
            />
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
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}
