import React from "react";
import './Avatar.css';

import { Text } from '../text/Text';

interface IAvatar {
  className?: string,
  name: string,
  bgColor: string,
  isCircle?: boolean,
  imageSrc?: string | undefined | null,
  size?: 'large' | 'normal' | 'small' | 'extra-small',
};

export function Avatar({
  className,
  name,
  bgColor,
  isCircle = false,
  imageSrc = undefined,
  size = 'normal',
} : IAvatar) {
  let textSize: ('h2' | 's1' | 'b1' | 'b3') = 's1';
  if (size === 'large') textSize = 'h2';
  if (size === 'small') textSize = 'b1';
  if (size === 'extra-small') textSize = 'b3';
  
  const classes = ['Avatar'];
  classes.push(`Avatar--${size}`)
  if (isCircle) classes.push('Avatar--circle');
  classes.push('noselect');
  if (className) classes.push(className);

  const style: React.CSSProperties = {};
  if (!imageSrc)  style.backgroundColor = bgColor;
  
  return (
    <div
      className={classes.join(' ')}
      aria-label={name}
      style={style}
    >
      {
        (imageSrc)
          ? (
            <img
              draggable="false"
              src={imageSrc}
              alt=""
            />
          ) : (
            <Text variant={textSize} weight="medium" type="span">{[...name][0]}</Text>
          )
      }
    </div>
  )
}