import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../atoms/button/Button";
import { Logo } from "./NavigationBar";
import "./FooterSection.css";
import { Label } from "../atoms/text/Label";
import { Icon } from "../atoms/icon/Icon";
import { Text } from "../atoms/text/Text";
import MatrixLogoSVG from "../../../res/svg/matrix-logo.svg";
import GithubLogoSVG from "../../../res/svg/github-logo.svg";
import TwitterLogoSVG from "../../../res/svg/twitter-logo.svg";
import ArrowForwardIC from "../../../res/ic/arrow-forward.svg";

function FotterMenu({ children }: { children: ReactNode }) {
  return <div className="flex flex-column gap-sm">{children}</div>;
}

export function FooterSection() {
  const navigate = useNavigate();

  return (
    <footer className="FooterSection flex flex-column items-center">
      <div className="FooterSection__content">
        <div className="FooterSection__branding flex justify-between items-center gap-md">
          <Logo />
          <Button onClick={() => navigate("/login")}>
            Get Started
            <Icon color="on-primary" src={ArrowForwardIC} />
          </Button>
        </div>
        <div className="flex flex-wrap">
          <FotterMenu>
            <Label className="uppercase">Join our community</Label>
            <a
              href="https://matrix.to/#thirdroom-public:matrix.org"
              target="_blank"
              className="flex items-center gap-xs"
            >
              <Icon size="sm" src={MatrixLogoSVG} />
              <Text variant="b2" type="span">
                Matrix
              </Text>
            </a>
            <a href="https://github.com/matrix-org/thirdroom/" target="_blank" className="flex items-center gap-xs">
              <Icon size="sm" src={GithubLogoSVG} />
              <Text variant="b2" type="span">
                Github
              </Text>
            </a>
            <a href="https://twitter.com/thirdroomio" target="_blank" className="flex items-center gap-xs">
              <Icon size="sm" src={TwitterLogoSVG} />
              <Text variant="b2" type="span">
                Twitter
              </Text>
            </a>
          </FotterMenu>
        </div>
      </div>
    </footer>
  );
}
