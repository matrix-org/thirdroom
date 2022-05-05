import classNames from "classnames";

import "./SettingTile.css";
interface SettingTileProps {
  className?: string;
  label: React.ReactNode;
  options?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingTile({ className, label, options, children }: SettingTileProps) {
  return (
    <div className={classNames("SettingTile", className)}>
      <div className="SettingTile__header flex items-center">
        {label}
        {options}
      </div>
      <div className="SettingTile__content">{children}</div>
    </div>
  );
}
