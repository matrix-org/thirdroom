import { Icon } from "../../../atoms/icon/Icon";
import { Button } from "../../../atoms/button/Button";
import { IconButton } from "../../../atoms/button/IconButton";
import { Switch } from "../../../atoms/button/Switch";
import { Label } from "../../../atoms/text/Label";
import { Input } from "../../../atoms/input/Input";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { SettingTileFlex } from "../../components/setting-tile/SettingTileFlex";
import { Window } from "../../components/window/Window";
import { WindowHeader } from "../../components/window/WindowHeader";
import { WindowHeaderTitle } from "../../components/window/WindowHeaderTitle";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowFooter } from "../../components/window/WindowFooter";
import LanguageIC from "../../../../../res/ic/language.svg";
import AddIC from "../../../../../res/ic/add.svg";
import "./CreateWorld.css";

export function CreateWorld() {
  return (
    <Window
      className="grow"
      header={
        <WindowHeader
          left={
            <WindowHeaderTitle icon={<Icon className="shrink-0" src={LanguageIC} color="surface" />}>
              Create World
            </WindowHeaderTitle>
          }
        />
      }
    >
      <WindowContent
        footer={
          <WindowFooter
            left={
              <Button fill="outline" onClick={() => console.log("click")}>
                Cancel
              </Button>
            }
            right={<Button onClick={() => console.log("click")}>Create World</Button>}
          />
        }
      >
        <Scroll>
          <div className="CreateWorld__content">
            <SettingTile label={<Label>Avatar</Label>}>
              <Thumbnail size="sm">
                <IconButton size="lg" iconSrc={AddIC} label="Add world avatar" />
              </Thumbnail>
            </SettingTile>
            <SettingTileFlex>
              <SettingTile label={<Label>Name</Label>}>
                <Input required />
              </SettingTile>
              <SettingTile label={<Label>Private</Label>}>
                <Switch defaultChecked={true} required />
              </SettingTile>
            </SettingTileFlex>
            <SettingTileFlex>
              <SettingTile label={<Label>Topic</Label>}>
                <Input required />
              </SettingTile>
              <SettingTile label={<Label>Alias</Label>}>
                <Input />
              </SettingTile>
            </SettingTileFlex>
          </div>
        </Scroll>
      </WindowContent>
    </Window>
  );
}
