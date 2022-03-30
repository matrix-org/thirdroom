import React from 'react';

import { Text } from '../text/Text';
import { Icon } from '../icon/Icon';
import { RawButton } from './RawButton';

import './Button.css';
interface IButton {
  className?: string;
  variant?: 'surface' | 'primary' | 'secondary' | 'positive' | 'danger';
  size?: 'normal' | 'small' | 'extra-small';
  iconSrc?: string;
  iconPlacement?: 'start' | 'end';
  type?: 'button' | 'submit' | 'reset';
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
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
    const icon = iconSrc ? <Icon size={size} src={iconSrc} /> : null;
    const classes: string[] = [];
    if (className) classes.push(className);
    classes.push(`Button Button--${size}`);

    return (
        <RawButton
            className={classes.join(' ')}
            variant={variant}
            type={type}
            onClick={onClick}
            disabled={disabled}
        >
            { iconPlacement === 'start' && icon }
            { typeof children === 'string'
                ? <Text variant={size === 'extra-small' ? 'b3' : 'b2'}>{ children }</Text>
                : children
            }
            { iconPlacement === 'end' && icon }
        </RawButton>
    );
}
