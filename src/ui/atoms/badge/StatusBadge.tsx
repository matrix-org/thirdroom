import "./StatusBadge.css";

interface IStatusBadge {
  status: "offline" | "online" | "dnd";
}

export function StatusBadge({ status }: IStatusBadge) {
  return <div className={`StatusBadge StatusBadge--${status}`} />;
}
