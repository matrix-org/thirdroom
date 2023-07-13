import { AllHTMLAttributes, forwardRef } from "react";
import classNames from "classnames";

import { Input } from "../../../atoms/input/Input";
import { Label } from "../../../atoms/text/Label";
import { SettingTile } from "../setting-tile/SettingTile";
import "./AttributionCard.css";

export const AttributionCard = forwardRef<HTMLFieldSetElement, AllHTMLAttributes<HTMLFieldSetElement>>(
  ({ className, ...props }, ref) => (
    <fieldset className={classNames("AttributionCard flex flex-column gap-xs", className)} {...props} ref={ref}>
      <div>
        <SettingTile label={<Label>Title</Label>}>
          <Input />
        </SettingTile>
      </div>
      <div className="flex gap-xs">
        <SettingTile className="grow basis-0" label={<Label>Author Name</Label>}>
          <Input />
        </SettingTile>
        <SettingTile className="grow basis-0" label={<Label>Author URL</Label>}>
          <Input />
        </SettingTile>
      </div>
      <div className="flex gap-xs">
        <SettingTile className="grow basis-0" label={<Label>License</Label>}>
          <Input />
        </SettingTile>
        <SettingTile className="grow basis-0" label={<Label>Source URL</Label>}>
          <Input />
        </SettingTile>
      </div>
    </fieldset>
  )
);
