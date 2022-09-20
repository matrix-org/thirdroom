import { useEffect, useState } from "react";

import { useHydrogen } from "./useHydrogen";

const ONBOARDING_KEY = "io.thirdroom.onboarding";

export function useOnboarding(worldId?: string) {
  const { session, platform } = useHydrogen(true);
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    async function run() {
      const homeAccountData = await session.getAccountData("org.matrix.msc3815.world.home");
      if (!homeAccountData) return;
      if (homeAccountData.room_id !== worldId) return;

      const onboardingData = await session.getAccountData(ONBOARDING_KEY);
      const { onboardingVersion } = platform.config;
      const lastOnboardingVersion = onboardingData?.version;

      if (typeof lastOnboardingVersion !== "number" || lastOnboardingVersion < onboardingVersion) {
        setOnboarding(true);
      }
    }

    if (worldId) run().catch(console.error);
  }, [worldId, session, platform.config]);

  const finishOnboarding = () => {
    setOnboarding(false);
    session.setAccountData(ONBOARDING_KEY, {
      version: platform.config.onboardingVersion,
    });
  };

  return { onboarding, finishOnboarding };
}
