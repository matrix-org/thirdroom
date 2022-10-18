import LogoFullSVG from "../../../../../res/svg/logo-full.svg";
import { CoverScreen } from "../cover-screen/CoverScreen";

export function SplashScreen() {
  return (
    <CoverScreen>
      <img src={LogoFullSVG} alt="Third Room" />
    </CoverScreen>
  );
}
