import React from 'react';
import './Scroll.css';

interface IScroll {
  className?: string;
  direction?: 'horizontal' | 'vertical' | 'both';
  visibility?: 'visible' | 'invisible' | 'auto';
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

export function Scroll({
    className,
    direction = 'vertical',
    visibility = 'auto',
    onScroll = undefined,
    children,
}: IScroll) {
    const classes = [`Scroll Scroll--${direction} Scroll--${visibility}`];
    if (className) classes.push(className);

    return (
        <div
            className={classes.join(' ')}
            onScroll={onScroll}
        >
            { children }
        </div>
    );
}
