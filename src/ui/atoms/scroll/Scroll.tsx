import React from 'react';
import './Scroll.css';

interface IScroll {
  direction?: 'horizontal' | 'vertical' | 'both',
  visibility?: 'visible' | 'invisible' | 'auto',
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void,
  children: React.ReactNode,
}

export function Scroll({
  direction = 'vertical',
  visibility = 'auto',
  onScroll = undefined,
  children,
}: IScroll) {
  return (
    <div
      className={`Scroll Scroll--${direction} Scroll--${visibility}`}
      onScroll={onScroll}
    >
      {children}
    </div>
  )
}
