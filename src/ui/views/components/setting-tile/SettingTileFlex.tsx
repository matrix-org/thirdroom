import "./SettingTileFlex.css";

interface SettingTileFlexProps {
  children: React.ReactNode;
}

export function SettingTileFlex({ children }: SettingTileFlexProps) {
  return <div className="SettingTileFlex flex items-start">{children}</div>;
}
