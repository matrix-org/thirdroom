import './RawButton.css';

interface IRawButton {
  className?: string,
  variant?: 'surface' | 'primary' | 'secondary' | 'positive' | 'danger',
  type?: 'button' | 'submit' | 'reset',
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode,
  disabled?: boolean,
}
export function RawButton({
  className = undefined,
  variant = 'surface',
  type = 'button',
  onClick,
  children,
  disabled = false,
}: IRawButton) {
  return (
    <button
      className={`${className ? `${className} ` : ''}RawButton-${variant}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
