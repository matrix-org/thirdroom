import { useCombobox } from "downshift";
import { useState } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Input } from "../../../atoms/input/Input";
import { MenuItem } from "../../../atoms/menu/MenuItem";
import { Scroll } from "../../../atoms/scroll/Scroll";
import ChevronBottomIC from "./../../../../../res/ic/chevron-bottom.svg";
import ChevronTopIC from "./../../../../../res/ic/chevron-top.svg";
import "./ComboInput.css";

interface Option<T> {
  value: T;
  label: string;
}
interface ComboInputProps<T> {
  options: Option<T>[];
  disabled?: boolean;
  selected: Option<T>;
  onSelectedChange: (value: Option<T>) => void;
  dropDownWidth?: number;
}
export function ComboInput<T>({ options, disabled, selected, onSelectedChange, dropDownWidth }: ComboInputProps<T>) {
  const [inputOptions, setInputOptions] = useState(options);

  const { isOpen, highlightedIndex, getToggleButtonProps, getMenuProps, getInputProps, getItemProps } = useCombobox({
    selectedItem: selected,
    items: inputOptions,
    itemToString: (item) => item?.label ?? "",
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue) return setInputOptions(options);
      setInputOptions(options.filter((option) => option.label.toLowerCase().startsWith(inputValue.toLowerCase())));
    },
    onSelectedItemChange: (change) => {
      if (change.selectedItem) onSelectedChange(change.selectedItem);
    },
  });

  return (
    <div className="ComboInput">
      <Input
        disabled={disabled}
        inputSize="sm"
        outlined
        after={
          <IconButton
            disabled={disabled}
            size="sm"
            iconSrc={isOpen ? ChevronTopIC : ChevronBottomIC}
            {...getToggleButtonProps()}
          />
        }
        {...getInputProps()}
      />
      <div className="ComboInput__menu" {...getMenuProps()}>
        {isOpen && (
          <Scroll className="ComboInput__menu-scroll">
            {inputOptions.map((option, index) => (
              <MenuItem
                variant={index === highlightedIndex ? "primary" : "surface"}
                key={option.label + index}
                {...getItemProps({ index, item: option })}
              >
                {option.label}
              </MenuItem>
            ))}
          </Scroll>
        )}
      </div>
    </div>
  );
}
