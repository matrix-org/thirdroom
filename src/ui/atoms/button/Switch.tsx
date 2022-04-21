import * as RadixSwitch from "@radix-ui/react-switch";
import classNames from "classnames";
import "./Switch.css";

interface ISwitch {
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

export function Switch({ className, value = "off", ...props }: ISwitch) {
  const switchClass = classNames("Switch", className);

  return (
    <RadixSwitch.Root className={switchClass} value={value} {...props}>
      <RadixSwitch.Thumb className="Switch__thumb" />
    </RadixSwitch.Root>
  );
}
