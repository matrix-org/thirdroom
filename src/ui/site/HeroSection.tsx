import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../atoms/button/Button";
import { Text } from "../atoms/text/Text";
import "./HeroSection.css";
import { Icon } from "../atoms/icon/Icon";
import { IconButton } from "../atoms/button/IconButton";
import ArrowForwardIC from "../../../res/ic/arrow-forward.svg";
import PlayIC from "../../../res/ic/play.svg";
import { isMobileDevice } from "../utils/common";

function PreviewVideoPlayer() {
  const preview = "https://matrix.thirdroom.io/_matrix/media/r0/download/matrix.org/eCIGHgUqQWmJrVdzUpTwrGbp";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);

  const playVideo = () => {
    if (videoRef.current === null) return;
    videoRef.current.play();
    setPlay(true);
  };

  return (
    <div className="PreviewVideoPlayer">
      <video ref={videoRef} controls={play} preload="none" autoPlay={false} poster="/landing/Hero.jpg">
        <source src={preview} type="video/mp4" />
      </video>
      {!play && (
        <div className="PreviewVideoPlayer__play-btn flex justify-center items-center">
          <IconButton
            onClick={playVideo}
            className="flex justify-center items-center"
            size="xl"
            iconSrc={PlayIC}
            variant="primary"
            label="Play Video"
          />
        </div>
      )}
    </div>
  );
}

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="HeroSection flex flex-column items-center">
      <div className="HeroSection__main flex flex-column items-center justify-center">
        <Text className="HeroSection__heading" variant="h2">
          Open, decentralised, immersive worlds built on Matrix
        </Text>
        <Button size="xl" onClick={() => navigate("/login")} disabled={isMobileDevice()}>
          <Text color="on-primary" weight="semi-bold">
            {isMobileDevice() ? "Try on Desktop" : "Get Started"}
          </Text>
          <Icon color="on-primary" src={ArrowForwardIC} />
        </Button>
      </div>
      <div className="HeroSection__video">
        <PreviewVideoPlayer />
      </div>
      <div className="HeroSection__curve">
        <svg viewBox="0 0 1742 318" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M871 0.5C1508.5 0.5 1742 318 1742 318H0C0 318 233.5 0.5 871 0.5Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
