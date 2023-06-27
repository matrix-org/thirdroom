import { Meta } from "@storybook/react";

import { Header } from "./Header";
import { HeaderTitle } from "./HeaderTitle";
import { Icon } from "../icon/Icon";
import ExploreIC from "../../../../res/ic/explore.svg";

export default {
  title: "Header",
  component: Header,
} as Meta<typeof Header>;

export function HeaderStories() {
  return (
    <div>
      <Header left={<HeaderTitle>Explore</HeaderTitle>} />
      <Header left={<HeaderTitle icon={<Icon src={ExploreIC} />}>Explore</HeaderTitle>} />
    </div>
  );
}
