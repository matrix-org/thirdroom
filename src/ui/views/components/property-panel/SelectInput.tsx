import { ReactNode } from "react";
import classNames from "classnames";
import { useSelect } from "downshift";

import { Icon } from "../../../atoms/icon/Icon";
import { Text } from "../../../atoms/text/Text";
import "./SelectInput.css";
import "./ComboInput.css";
import ChevronBottomIC from "./../../../../../res/ic/chevron-bottom.svg";
import ChevronTopIC from "./../../../../../res/ic/chevron-top.svg";
import { MenuItem } from "../../../atoms/menu/MenuItem";
import { Scroll } from "../../../atoms/scroll/Scroll";

interface SelectInputProps<T> {
  before?: ReactNode;
  options: { value: T; label: string }[];
  disabled?: boolean;
  value: T;
  onChange: (value: T) => void;
}

export function SelectInput<T>({ before, options, disabled, value, onChange }: SelectInputProps<T>) {
  const selectedOption = options.find((option) => option.value === value);

  const { isOpen, highlightedIndex, getToggleButtonProps, getMenuProps, getItemProps } = useSelect({
    selectedItem: selectedOption,
    items: options,
    itemToString: (item) => item?.label ?? "",
    onSelectedItemChange: (change) => {
      if (change.selectedItem) onChange(change.selectedItem.value);
    },
  });

  return (
    <div className="ComboInput">
      <div className={classNames("SelectInput", { "SelectInput--disabled": disabled }, "flex items-center gap-xxs")}>
        {before}
        <button
          className="SelectInput__button grow flex items-center gap-xxs"
          {...getToggleButtonProps()}
          type="button"
          disabled={disabled}
        >
          <Text className="grow truncate" variant="b3">
            {selectedOption?.label ?? "Select Item"}
          </Text>
          <Icon src={isOpen ? ChevronTopIC : ChevronBottomIC} size="sm" />
        </button>
      </div>
      <div className="ComboInput__menu" {...getMenuProps()}>
        {isOpen && (
          <Scroll className="ComboInput__menu-scroll">
            {options.map((option, index) => (
              <MenuItem
                variant={highlightedIndex === index ? "primary" : "surface"}
                key={option.label + index}
                {...getItemProps({ item: option, index })}
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
