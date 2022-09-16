import { useState, useRef, useCallback } from "react";

import { useIsMounted } from "./useIsMounted";

export function useAlert() {
  const [{ alertShown, alertText }, setAlertState] = useState({ alertShown: false, alertText: "" });
  const isMounted = useIsMounted();
  const alertTimeoutRef = useRef<number>();

  const showAlert = useCallback(
    (alertText) => {
      setAlertState({
        alertShown: true,
        alertText,
      });

      clearTimeout(alertTimeoutRef.current);

      alertTimeoutRef.current = window.setTimeout(() => {
        if (isMounted()) {
          setAlertState((state) => ({ ...state, alertShown: false }));
        }
      }, 2000);
    },
    [isMounted]
  );

  return { alertShown, alertText, showAlert };
}
