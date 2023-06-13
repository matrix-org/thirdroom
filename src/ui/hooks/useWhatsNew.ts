import { useEffect } from "react";
import { useAtom } from "jotai";

import { useHydrogen } from "./useHydrogen";
import { whatsNewAtom } from "../state/whatsNew";

const WHATS_NEW_KEY = "io.thirdroom.whats_new";

export function useWhatsNew() {
  const { session, platform } = useHydrogen(true);
  const [whatsNew, setWhatsNew] = useAtom(whatsNewAtom);

  useEffect(() => {
    async function run() {
      const whatsNewData = await session.getAccountData(WHATS_NEW_KEY);
      const { whatsNewVersion } = platform.config;
      const lastWhatsNewVersion = whatsNewData?.version;

      if (typeof lastWhatsNewVersion !== "number" || lastWhatsNewVersion < whatsNewVersion) {
        setWhatsNew(true);
      }
    }

    run().catch(console.error);
  }, [session, platform.config, setWhatsNew]);

  const finishWhatsNew = () => {
    setWhatsNew(false);
    session.setAccountData(WHATS_NEW_KEY, {
      version: platform.config.whatsNewVersion,
    });
  };

  return { whatsNew, finishWhatsNew };
}
