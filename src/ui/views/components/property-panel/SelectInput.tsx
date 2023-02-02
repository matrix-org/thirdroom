import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";

import { Icon } from "../../../atoms/icon/Icon";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Text } from "../../../atoms/text/Text";
import "./SelectInput.css";
import ChevronBottomIC from "./../../../../../res/ic/chevron-bottom.svg";
import ChevronTopIC from "./../../../../../res/ic/chevron-top.svg";

interface SelectInputProps<T> {
  options: { value: T; label: string }[];
  disabled?: boolean;
  value: T;
  onChange: (value: T) => void;
  dropDownWidth?: number;
}

export function SelectInput<T>({ options, disabled, value, onChange, dropDownWidth }: SelectInputProps<T>) {
  const selectedOption = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);

  return (
    <>
      <RadixDropdownMenu.Root open={disabled ? false : open} onOpenChange={setOpen}>
        <RadixDropdownMenu.DropdownMenuTrigger asChild>
          <button onClick={() => setOpen(!open)} className="SelectInput" disabled={disabled}>
            <Text className="grow" variant="b3">
              {selectedOption?.label ?? "Select Item"}
            </Text>
            <Icon src={open ? ChevronTopIC : ChevronBottomIC} size="sm" />
          </button>
        </RadixDropdownMenu.DropdownMenuTrigger>
        <RadixDropdownMenu.Content
          style={{ width: dropDownWidth }}
          className="SelectInput__content"
          sideOffset={8}
          side="bottom"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              variant={option.value === value ? "primary" : "surface"}
              key={option.label}
              onSelect={() => onChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Root>
    </>
  );
}
