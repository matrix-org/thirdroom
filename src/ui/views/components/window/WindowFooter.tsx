import "./WindowFooter.css";

interface WindowFooterProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export function WindowFooter({ left, center, right }: WindowFooterProps) {
  return (
    <footer className="WindowFooter flex items-center">
      <div className="WindowFooter__left grow basis-0">{left}</div>
      <div className="WindowFooter__center">{center}</div>
      <div className="WindowFooter__right grow basis-0 flex justify-end">{right}</div>
    </footer>
  );
}
