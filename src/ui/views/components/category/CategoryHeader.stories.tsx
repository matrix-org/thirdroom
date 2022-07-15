import { CategoryHeader } from "./CategoryHeader";
import { IconButton } from "../../../atoms/button/IconButton";
import { Icon } from "../../../atoms/icon/Icon";
import StarIC from "../../../../../res/ic/star.svg";
import ChevronRightIC from "../../../../../res/ic/chevron-right.svg";
import AddIC from "../../../../../res/ic/add.svg";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";

export const title = "CategoryHeader";

export default function CategoryHeaderStories() {
  const icon = <Icon src={StarIC} size="sm" color="surface" />;
  const icon1 = <Icon src={ChevronRightIC} size="sm" color="surface" />;

  return (
    <div style={{ backgroundColor: "white", maxWidth: "380px" }}>
      <CategoryHeader before={icon} title="Favorite Worlds" />

      <CategoryHeader
        title="All Messages"
        options={
          <>
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />
            <IconButton size="sm" label="Notifications" iconSrc={AddIC} onClick={(a) => console.log("clicked")} />
          </>
        }
      />

      <CategoryHeader
        before={icon}
        title="Favorite Rooms"
        after={icon1}
        onClick={() => console.log("hello")}
        options={
          <>
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />
            <IconButton size="sm" label="Notifications" iconSrc={AddIC} onClick={(a) => console.log("clicked")} />
          </>
        }
      />
    </div>
  );
}
