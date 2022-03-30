import React from 'react';
import './Text.css';

interface IText {
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  variant?: 'h2' | 's1' | 'b1' | 'b2' | 'b3';
  weight?: 'regular' | 'medium' | 'semi-bold';
  type?: undefined | 'span' | 'div';
  children: React.ReactNode;
}

export function Text({
    className = undefined,
    style = undefined,
    variant = 'b1',
    weight = 'regular',
    type = undefined,
    children,
}: IText) {
    const classes = [];
    if (className) classes.push(className);

    classes.push(`Text Text-${variant} Text--${weight}`);

    const textClass = classes.join(' ');
    if (type === 'span') return <span className={textClass} style={style}>{ children }</span>;
    if (type === 'div') return <div className={textClass} style={style}>{ children }</div>;
    if (variant === 'h2') return <h2 className={textClass} style={style}>{ children }</h2>;
    if (variant === 's1') return <h4 className={textClass} style={style}>{ children }</h4>;
    return <p className={textClass} style={style}>{ children }</p>;
}
