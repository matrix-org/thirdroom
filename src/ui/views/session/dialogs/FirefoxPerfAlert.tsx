import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { AlertDialog } from "./AlertDialog";

const FIREFOX_PERF_ALERT_KEY = "firefox_perf_alert";

const isGecko = typeof navigator !== "undefined" && navigator.userAgent.indexOf("Gecko/") >= 0;

export function FirefoxPerfAlert() {
  const [alertVisible, setAlertVisible] = useLocalStorage(FIREFOX_PERF_ALERT_KEY, isGecko);

  const handleClose = () => setAlertVisible(false);

  return (
    <AlertDialog
      open={alertVisible}
      requestClose={handleClose}
      title="Warning"
      content={
        <Text variant="b2">
          Third Room is currently experiencing degraded performance in Firefox due to a bug in the browser’s garbage
          collector when using multiple threads. We’re currently investigating this problem and possible workarounds.{" "}
          <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1822411" target="_blank" referrerPolicy="no-referrer">
            Read More
          </a>
        </Text>
      }
      buttons={
        <Button onClick={handleClose} variant="primary" fill="outline">
          Ok
        </Button>
      }
    />
  );
}
