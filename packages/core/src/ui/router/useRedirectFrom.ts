import { useCallback } from "react";
import { Location, LocationDescriptor } from "history";
import { useHistory, useLocation } from "react-router-dom";

export function useRedirectFrom(
  fallbackLocation: LocationDescriptor | string = "/"
) {
  const location = useLocation<{ from?: Location }>();
  const history = useHistory();

  const redirect = useCallback(() => {
    if (location.state && location.state.from) {
      history.replace(location.state.from);
    } else {
      history.replace(fallbackLocation);
    }
  }, [location, history]);

  return redirect;
}
