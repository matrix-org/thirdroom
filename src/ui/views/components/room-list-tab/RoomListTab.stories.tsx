import { RoomListTab } from "./RoomListTab";
import HomeIC from "../../../../../res/ic/home.svg";
import LanguageIC from "../../../../../res/ic/language.svg";
import ChatIC from "../../../../../res/ic/chat.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import SettingIC from "../../../../../res/ic/setting.svg";

export const title = "RoomListTab";

export default function RoomListTabStories() {
  return (
    <div className="flex" style={{ backgroundColor: "white", maxWidth: "380px" }}>
      <RoomListTab name="Home" iconSrc={HomeIC} isActive={true} onClick={() => console.log("clicked")} />
      <RoomListTab name="Public" iconSrc={LanguageIC} onClick={() => console.log("clicked")} />
      <RoomListTab name="Direct Messages" iconSrc={ChatIC} onClick={() => console.log("clicked")} />
      <RoomListTab name="Friends" iconSrc={PeoplesIC} onClick={() => console.log("clicked")} />
      <RoomListTab name="Settings" iconSrc={SettingIC} onClick={() => console.log("clicked")} />
    </div>
  );
}
