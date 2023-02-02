import * as RadixCheckbox from "@radix-ui/react-checkbox";
import classNames from "classnames";

import "./Checkbox.css";

interface CheckboxProps {
  id?: string;
  className?: string;
  name?: string;
  value?: string | "off";
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <RadixCheckbox.Root className={classNames("Checkbox", className)} {...props}>
      <RadixCheckbox.Indicator />
    </RadixCheckbox.Root>
  );
}
