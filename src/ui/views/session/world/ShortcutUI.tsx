import { ReactNode } from "react";

import { Kbd } from "../../../atoms/keyboard/Kbd";
import { Icon } from "../../../atoms/icon/Icon";
import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { Label } from "../../../atoms/text/Label";
import { Text } from "../../../atoms/text/Text";
import "./ShortcutUI.css";

export function ShortcutUI() {
  const renderItem = (name: string, kbd: ReactNode) => (
    <div className="flex items-center">
      <Text variant="b2" className="grow">
        {name}
      </Text>
      <div className="inline-flex items-center gap-xs">{kbd}</div>
    </div>
  );

  return (
    <div className="ShortcutUI">
      <div className="ShortcutUI__main">
        <Text className="flex flex-column items-center gap-xs">
          <Kbd size="lg">W</Kbd>
          <div className="flex items-center gap-xs">
            <Kbd size="lg">A</Kbd>
            <Kbd size="lg">S</Kbd>
            <Kbd size="lg">D</Kbd>
          </div>
        </Text>
        <Text className="text-center" style={{ marginTop: "var(--sp-lg)" }}>
          Use WASD keys and mouse to move around and explore worlds.
        </Text>
      </div>
      <Category header={<CategoryHeader title="Action" options={<Label>Key</Label>} />}>
        <div className="ShortcutUI__list">
          {renderItem("Run", <Kbd size="xs">Shift</Kbd>)}
          {renderItem("Jump", <Kbd size="xs">Space</Kbd>)}
          {renderItem(
            "Grab/Drop Object",
            <>
              <Kbd size="xs">E</Kbd>
              <Text variant="b3">/</Text>
              <Icon src={MouseIC} />
            </>
          )}
          {renderItem("Spawn Cube", <Kbd size="xs">1</Kbd>)}
          {renderItem("Spawn Sphere", <Kbd size="xs">2</Kbd>)}
        </div>
      </Category>
    </div>
  );
}
