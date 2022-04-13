import { Platform, Navigation, Client, ISessionInfo, Session, ILogger, URLRouter } from "hydrogen-view-sdk";
import { createContext, useContext } from "react";

interface HydrogenContext {
  client: Client;
  navigation: Navigation;
  platform: Platform;
  availableSessions: ISessionInfo[];
  session?: Session;
  logger: ILogger;
  urlRouter: URLRouter;
}

const HydrogenContext = createContext<HydrogenContext | undefined>(undefined);

export const HydrogenContextProvider = HydrogenContext.Provider;

export function useHydrogen(): HydrogenContext {
  const context = useContext(HydrogenContext);

  if (!context) {
    throw new Error("HydrogenContext not initialized");
  }

  return context;
}
