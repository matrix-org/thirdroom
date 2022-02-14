import React from 'react';
import './IconButton.css';

import { Icon } from '../icon/Icon';
import { RawButton } from './RawButton';

interface IIconButton {
  className?: string,
  variant?: 'surface' | 'primary' | 'secondary' | 'positive' | 'danger',
  size?: 'normal' | 'small',
  isCircle?: boolean,
  shadedSurface?: boolean,
  iconSrc: string,
  label: string,
  type?: 'button' | 'submit' | 'reset',
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean,
}

export function IconButton({
  className = undefined,
  variant = 'surface',
  size = 'normal',
  isCircle = false,
  shadedSurface = false,
  iconSrc,
  label,
  type = 'button',
  onClick,
  disabled = false,
}: IIconButton) {
  const classes: string[] = [];
  if (className) classes.push(className);
  classes.push(`IconButton IconButton--${size}`);
  if (isCircle) classes.push('IconButton--circle');
  if (shadedSurface && variant === "surface") classes.push('IconButton--shaded');
  
  return (
    <RawButton
      className={classes.join(' ')}
      variant={variant}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <Icon size={size} src={iconSrc} />
    </RawButton>
  );
}
