// disable-noopener
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
import MastodonLogoSVG from "../../../res/svg/mastodon-logo.svg";
import ArrowForwardIC from "../../../res/ic/arrow-forward.svg";
import { isMobileDevice } from "../utils/common";

function FooterMenu({ children }: { children: ReactNode }) {
  return <div className="flex flex-column gap-sm">{children}</div>;
}

export function FooterSection() {
  const navigate = useNavigate();

  return (
    <footer className="FooterSection flex flex-column items-center">
      <div className="FooterSection__content">
        <div className="FooterSection__branding flex justify-between items-center gap-md">
          <Logo />
          <Button size="lg" onClick={() => navigate("/login")} disabled={isMobileDevice()}>
            {isMobileDevice() ? "Try on Desktop" : "Get Started"}
            <Icon color="on-primary" src={ArrowForwardIC} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-lg">
          <FooterMenu>
            <Label className="uppercase">Join our community</Label>
            <a href="https://matrix.to/#/#thirdroom-dev:matrix.org" className="flex items-center gap-xs">
              <Icon size="sm" src={MatrixLogoSVG} />
              <Text variant="b2" type="span">
                Matrix
              </Text>
            </a>
            <a href="https://github.com/matrix-org/thirdroom/" className="flex items-center gap-xs">
              <Icon size="sm" src={GithubLogoSVG} />
              <Text variant="b2" type="span">
                Github
              </Text>
            </a>
            <a rel="me" href="https://mastodon.matrix.org/@thirdroom" className="flex items-center gap-xs">
              <Icon size="sm" src={MastodonLogoSVG} />
              <Text variant="b2" type="span">
                Mastodon
              </Text>
            </a>
            <a href="https://twitter.com/thirdroomio" className="flex items-center gap-xs">
              <Icon size="sm" src={TwitterLogoSVG} />
              <Text variant="b2" type="span">
                Twitter
              </Text>
            </a>
          </FooterMenu>
          <FooterMenu>
            <Label className="uppercase">Blog</Label>
            <a href="/preview" className="flex items-center gap-xs">
              Introducing Third Room
            </a>
          </FooterMenu>
        </div>
        <div className="FooterSection__copyright">
          <Text variant="b2">
            {"Copyright © 2023 Element • "}
            <a href="https://element.io/legal">Legal</a>
            {" • "}
            <a href="https://element.io/privacy">Privacy</a>
          </Text>
        </div>
      </div>
    </footer>
  );
}
