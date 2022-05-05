import "./WindowHeader.css";

interface WindowHeaderProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export function WindowHeader({ left, center, right }: WindowHeaderProps) {
  return (
    <header className="WindowHeader flex items-center">
      <div className="grow basis-0">{left}</div>
      <div>{center}</div>
      <div className="grow basis-0 flex justify-end">{right}</div>
    </header>
  );
}
