import { useCallback } from "react";
import { LocationDescriptor } from "history";
import { useHistory, useLocation } from "react-router-dom";

export type AuthRedirectPath = string | LocationDescriptor;

let redirectPath: AuthRedirectPath | undefined;

export function useSetAuthRedirectPath(path: AuthRedirectPath | undefined) {
  redirectPath = path;
}

export function useAuthRedirect(
  fallbackLocation: LocationDescriptor | string = "/"
) {
  const location = useLocation();
  const history = useHistory();

  const redirect = useCallback(() => {
    if (redirectPath) {
      history.replace(redirectPath);
      redirectPath = undefined;
    } else {
      history.replace(fallbackLocation);
    }
  }, [location, history]);

  return redirect;
}
