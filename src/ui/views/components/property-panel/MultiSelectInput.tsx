import { useCombobox, useMultipleSelection } from "downshift";
import { useMemo, useState } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Input } from "../../../atoms/input/Input";
import { MenuItem } from "../../../atoms/menu/MenuItem";
import { Text } from "../../../atoms/text/Text";
import { Chip } from "../../../atoms/chip/Chip";
import ChevronBottomIC from "./../../../../../res/ic/chevron-bottom.svg";
import ChevronTopIC from "./../../../../../res/ic/chevron-top.svg";
import CrossIC from "./../../../../../res/ic/cross.svg";
import "./ComboInput.css";
import { Scroll } from "../../../atoms/scroll/Scroll";

interface Option<T> {
  value: T;
  label: string;
}

interface MultiSelectInputProps<T> {
  options: Option<T>[];
  disabled?: boolean;
  selected: Option<T>[];
  onSelectedChange: (value: Option<T>[]) => void;
}

function getFilteredOptions<T>(options: Option<T>[], selectedOptions: Option<T>[], inputValue: string) {
  return options.filter(
    (option) =>
      !selectedOptions.find((sOption) => sOption.value === option.value) &&
      option.label.toLowerCase().startsWith(inputValue.toLowerCase())
  );
}

export function MultiSelectInput<T>({ options, disabled, selected, onSelectedChange }: MultiSelectInputProps<T>) {
  const [inputValue, setInputValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState(selected);
  const inputOptions = useMemo(
    () => getFilteredOptions(options, selectedOptions, inputValue),
    [options, selectedOptions, inputValue]
  );

  const { getDropdownProps, removeSelectedItem } = useMultipleSelection({
    selectedItems: selectedOptions,
    onStateChange({ selectedItems: newSelectedItems, type }) {
      switch (type) {
        case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownBackspace:
        case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
        case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
        case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
          setSelectedOptions(newSelectedItems ?? []);
          break;
        default:
          break;
      }
    },
  });

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps } = useCombobox({
    items: inputOptions,
    itemToString: (item) => {
      return item?.label ?? "";
    },
    defaultHighlightedIndex: 0,
    selectedItem: null,
    stateReducer(state, actionAndChanges) {
      const { changes, type } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          return {
            ...changes,
            ...(changes.selectedItem && { isOpen: true, highlightedIndex: 0 }),
          };
        default:
          return changes;
      }
    },
    onStateChange({ inputValue: newInputValue, type, selectedItem: newSelectedOptions }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          if (newSelectedOptions) setSelectedOptions([...selectedOptions, newSelectedOptions]);
          break;
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(newInputValue ?? "");
          break;
        default:
          break;
      }
    },
  });

  return (
    <div className="ComboInput">
      <Input
        className="flex-wrap"
        before={
          selectedOptions.length > 0 && (
            <div className="flex gap-xs flex-wrap" style={{ width: "100%", marginTop: "var(--sp-xs)" }}>
              {selectedOptions.map((option) => (
                <Chip key={option.label} size="sm">
                  <Text className="truncate" variant="b3" weight="medium">
                    {option.label}
                  </Text>
                  <IconButton onClick={() => removeSelectedItem(option)} size="sm" iconSrc={CrossIC} label="Remove" />
                </Chip>
              ))}
            </div>
          )
        }
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
        {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
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
