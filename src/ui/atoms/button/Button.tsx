import React from 'react';
import './Button.css';

import { Text } from '../text/Text';
import { Icon } from '../icon/Icon';

interface IButton {
  className?: string,
  variant?: 'surface' | 'primary' | 'secondary' | 'positive' | 'danger',
  size?: 'normal' | 'small' | 'extra-small',
  iconSrc?: string,
  iconPlacement?: 'start' | 'end',
  type?: 'button' | 'submit' | 'reset',
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode,
  disabled?: boolean,
}

export function Button({
  className = undefined,
  variant = 'surface',
  size = 'normal',
  iconSrc = undefined,
  iconPlacement = 'start',
  type = 'button',
  onClick,
  children,
  disabled = false,
}: IButton) {
  const icon =  iconSrc ? <Icon size={size} src={iconSrc} /> : null;

  return (
    <button
      className={`${className ? `${className} ` : ''}Button Button-${variant} Button--${size}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      { iconPlacement === 'start' && icon }
      { typeof children === 'string'
        ? <Text variant={size === 'extra-small' ? 'b3' : 'b2'}>{children}</Text>
        : children
      }
      { iconPlacement === 'end' && icon }
    </button>
  );
}
