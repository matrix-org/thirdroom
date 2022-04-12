import classNames from "classnames";
import "./RawButton.css";

interface IRawButton {
  className?: string;
  variant?: "surface" | "primary" | "secondary" | "positive" | "danger";
  type?: "button" | "submit" | "reset";
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}
export function RawButton({
  className,
  variant = "surface",
  type = "button",
  onClick,
  children,
  disabled = false,
}: IRawButton) {
  const btnClass = classNames(`RawButton-${variant}`, className);
  return (
    <button className={btnClass} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
