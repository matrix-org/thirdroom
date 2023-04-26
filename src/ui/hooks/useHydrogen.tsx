import { Platform, Navigation, Client, Session, ILogger, URLRouter, ILoginMethod } from "@thirdroom/hydrogen-view-sdk";
import { createContext, useContext } from "react";

export interface HydrogenContext {
  client: Client;
  navigation: Navigation;
  platform: Platform;
  session?: Session;
  logger: ILogger;
  urlRouter: URLRouter;
  login: (loginMethod: ILoginMethod) => Promise<void>;
  logout: () => Promise<void>;
}

export interface AuthenticatedHydrogenContext extends HydrogenContext {
  session: Session;
}

export const HydrogenContext = createContext<HydrogenContext | undefined>(undefined);

export const HydrogenContextProvider = HydrogenContext.Provider;

export function useHydrogen(ensureAuth: true): AuthenticatedHydrogenContext;
export function useHydrogen(ensureAuth: false): HydrogenContext;
export function useHydrogen(ensureAuth?: boolean): HydrogenContext;
export function useHydrogen(ensureAuth = false): HydrogenContext | AuthenticatedHydrogenContext {
  const context = useContext(HydrogenContext);

  if (!context) {
    throw new Error("HydrogenContext not initialized");
  }

  if (ensureAuth && !context.session) {
    throw new Error("Must be authenticated to access authenticated hydrogen context");
  }

  return context;
}
