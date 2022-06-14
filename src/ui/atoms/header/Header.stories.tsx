import { Header } from "./Header";
import { HeaderTitle } from "./HeaderTitle";
import { Icon } from "../icon/Icon";
import ExploreIC from "../../../../res/ic/explore.svg";

export const title = "Header";

export default function HeaderStories() {
  return (
    <div>
      <Header left={<HeaderTitle>Explore</HeaderTitle>} />
      <Header left={<HeaderTitle icon={<Icon src={ExploreIC} />}>Explore</HeaderTitle>} />
    </div>
  );
}
