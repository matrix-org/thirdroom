import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";

import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { worldAtom } from "../../../state/world";
import { OnboardingModal } from "./OnboardingModal";

export function WorldOnboarding({ world }: { world: Room }) {
  const mainThread = useMainThreadContext();
  const isWorldEntered = useAtomValue(worldAtom).entered;

  const { onboarding, finishOnboarding } = useOnboarding(isWorldEntered ? world.id : undefined);

  useEffect(() => {
    if (onboarding) document.exitPointerLock();
  }, [onboarding]);

  const onFinishOnboarding = useCallback(() => {
    finishOnboarding();
    mainThread.canvas?.requestPointerLock();
  }, [mainThread.canvas, finishOnboarding]);

  return <OnboardingModal open={onboarding} world={world} requestClose={onFinishOnboarding} />;
}
