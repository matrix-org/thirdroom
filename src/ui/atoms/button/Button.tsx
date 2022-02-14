import React from 'react';
import './Button.css';

import { Text } from '../text/Text';
import { Icon } from '../icon/Icon';

interface IButton {
  className?: string,
  variant?: 'surface' | 'primary' | 'secondary' | 'positive' | 'danger',
  size?: 'normal' | 'small' | 'extra-small',
  iconSrc?: string,
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
  type = 'button',
  onClick,
  children,
  disabled = false,
}: IButton) {
  return (
    <button
      className={`${className ? `${className} ` : ''}btn btn-${variant} btn--${size}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      { iconSrc && <Icon size={size} src={iconSrc} />}
      { typeof children === 'string'
        ? <Text variant={size === 'extra-small' ? 'b3' : 'b2'}>{children}</Text>
        : children
      }
    </button>
  );
}
