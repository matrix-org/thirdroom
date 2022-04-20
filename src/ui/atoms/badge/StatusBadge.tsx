import "./StatusBadge.css";

interface IStatusBadge {
  status: "offline" | "online" | "dnd";
}

export function StatusBadge({ status }: IStatusBadge) {
  return <span className={`StatusBadge StatusBadge--${status}`} />;
}
