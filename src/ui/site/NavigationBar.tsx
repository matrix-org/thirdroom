import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { useState } from "react";

import { Button } from "../atoms/button/Button";
import { Text } from "../atoms/text/Text";
import LogoFullSVG from "../../../res/svg/logo-full.svg";
import ChevronBottomIC from "../../../res/ic/chevron-bottom.svg";
import MenuIC from "../../../res/ic/menu.svg";
import CrossIC from "../../../res/ic/cross.svg";
import "./NavigationBar.css";
import "../atoms/menu/MenuItem.css";
import { isMobileDevice } from "../utils/common";
import { Icon } from "../atoms/icon/Icon";
import { IconButton } from "../atoms/button/IconButton";
import { DropdownMenu } from "../atoms/menu/DropdownMenu";

export function Logo() {
  return (
    <a className="inline-flex flex-column items-end gap-xxs Logo" href="/landing">
      <img height={20} src={LogoFullSVG} alt="Third Room" />
      <Text variant="b3" weight="medium" className="uppercase">
        Creator Update
      </Text>
    </a>
  );
}

export function CreateMenuItems() {
  return (
    <>
      <a className="MenuItem MenuItem--surface truncate" href="/docs">
        <Text variant="b2" weight="medium" type="span">
          Documentation
        </Text>
      </a>
      <a className="MenuItem MenuItem--surface truncate" href="/docs/websg-js/">
        <Text variant="b2" weight="medium" type="span">
          Web Scene Graph API
        </Text>
      </a>
      <a className="MenuItem MenuItem--surface truncate" href="/docs/guides/unity/">
        <Text variant="b2" weight="medium" type="span">
          Unity Exporter
        </Text>
      </a>
    </>
  );
}

export function CommunityMenuItems() {
  return (
    <>
      <a className="MenuItem MenuItem--surface truncate" href="https://matrix.to/#/#thirdroom-dev:matrix.org">
        <Text variant="b2" weight="medium" type="span">
          Matrix
        </Text>
      </a>
      <a className="MenuItem MenuItem--surface truncate" href="https://github.com/matrix-org/thirdroom/">
        <Text variant="b2" weight="medium" type="span">
          Github
        </Text>
      </a>
      <a className="MenuItem MenuItem--surface truncate" href="https://mastodon.matrix.org/@thirdroom">
        <Text variant="b2" weight="medium" type="span">
          Mastodon
        </Text>
      </a>
      <a className="MenuItem MenuItem--surface truncate" href="https://twitter.com/thirdroomio">
        <Text variant="b2" weight="medium" type="span">
          Twitter
        </Text>
      </a>
    </>
  );
}

export function NavigationBar() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  return (
    <nav className="NavigationBar shrink-0 flex items-center gap-lg">
      <div className="grow">
        <Logo />
      </div>
      <IconButton
        onClick={() => setMenu(!menu)}
        className="NavigationBar__menuBtn"
        iconSrc={menu ? CrossIC : MenuIC}
        label="Toggle Menu"
      />
      <div
        className={classNames("NavigationBar__menu flex items-center gap-xxs", {
          "NavigationBar__menu--open": menu,
        })}
      >
        <DropdownMenu content={<CreateMenuItems />}>
          <Button fill="none">
            <Text className="flex items-center" variant="b2" weight="medium">
              Create
              <Icon src={ChevronBottomIC} />
            </Text>
          </Button>
        </DropdownMenu>
        <DropdownMenu content={<CommunityMenuItems />}>
          <Button fill="none">
            <Text className="flex items-center" variant="b2" weight="medium">
              Community
              <Icon src={ChevronBottomIC} />
            </Text>
          </Button>
        </DropdownMenu>
        {!isMobileDevice() && <Button onClick={() => navigate("/login")}>Login</Button>}
      </div>
    </nav>
  );
}
