import React, { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...rest }, ref) => {
    return (
      <button {...rest} ref={ref}>
        {children}
      </button>
    );
  }
);
