import React, { CSSProperties } from 'react';
import './Icon.css';

interface IIcon {
  color?: string,
  size?: 'normal' | 'small' | 'extra-small',
  src: string,
  isImage?: boolean
}

export function Icon({
  color = 'var(--ic-surface-normal)',
  size = 'normal',
  src,
  isImage = false,
}: IIcon) {
  const style: CSSProperties = {};
  if (color !== null) style.backgroundColor = color;
  if (isImage) {
    style.backgroundColor = 'transparent';
    style.backgroundImage = `url(${src})`;
  } else {
    style.WebkitMaskImage = `url(${src})`;
    style.maskImage = `url(${src})`;
  }

  return <span className={`icon icon--${size}`} style={style} />;
}
