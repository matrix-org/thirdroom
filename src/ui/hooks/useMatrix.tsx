import { MatrixClient } from "@thirdroom/matrix-js-sdk";
import { createContext, useContext } from "react";

export interface MatrixContext {
  client?: MatrixClient;
  setClient: (client: MatrixClient | undefined) => void;
}

export interface AuthenticatedMatrixContext extends MatrixContext {
  client: MatrixClient;
}

const MatrixContext = createContext<MatrixContext | undefined>(undefined);

export const MatrixContextProvider = MatrixContext.Provider;

export function useMatrix(ensureAuth: true): AuthenticatedMatrixContext;
export function useMatrix(ensureAuth: false): MatrixContext;
export function useMatrix(ensureAuth?: boolean): MatrixContext;
export function useMatrix(ensureAuth = false): MatrixContext | AuthenticatedMatrixContext {
  const context = useContext(MatrixContext);

  if (!context) {
    throw new Error("MatrixContext not initialized");
  }

  if (ensureAuth && !context.client) {
    throw new Error("Must be authenticated to access authenticated matrix context");
  }

  return context;
}
