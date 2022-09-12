import "./SplashScreen.css";

import LogoFullSVG from "../../../../../res/svg/logo-full.svg";

export function SplashScreen() {
  return (
    <div className="SplashScreen flex flex-column justify-center items-center">
      <img src={LogoFullSVG} alt="Third Room" />
    </div>
  );
}
