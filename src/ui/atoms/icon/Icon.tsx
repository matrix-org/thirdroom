import React, { CSSProperties } from 'react';
import './Icon.css';

interface IIcon {
  color?: string | undefined,
  size?: 'normal' | 'small' | 'extra-small',
  src: string,
  isImage?: boolean
}

export function Icon({
  color = undefined,
  size = 'normal',
  src,
  isImage = false,
}: IIcon) {
  const style: CSSProperties = {};
  if (typeof color === 'string') style.backgroundColor = color;
  if (isImage) {
    style.backgroundColor = 'transparent';
    style.backgroundImage = `url(${src})`;
  } else {
    style.WebkitMaskImage = `url(${src})`;
    style.maskImage = `url(${src})`;
  }

  return <span className={`Icon Icon--${size}`} style={style} />;
}
