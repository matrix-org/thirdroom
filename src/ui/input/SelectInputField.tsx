import React, { forwardRef, useCallback } from "react";
import { FieldValues, useController, UseControllerProps } from "react-hook-form";
import { useSelect, UseSelectStateChange } from "downshift";
import { ErrorMessage, ErrorMessageValue } from "./ErrorMessage";

export interface SelectOption {
  name: string,
  value: any
}

type SelectInputFieldProps = UseControllerProps & {
  label: string,
  onChange: (selectedOption: SelectOption) => void,
  onBlur: () => void,
  options: SelectOption[],
  error?: ErrorMessageValue,
}

function itemToString(item: SelectOption | null) {
  return item ? item.name : "";
}

export const SelectInputField = forwardRef<HTMLButtonElement, SelectInputFieldProps>(({ label, onChange, onBlur, options, error }, ref) => {
  const onSelectedItemChange = useCallback((changes: UseSelectStateChange<SelectOption>) => {
    onChange(changes.selectedItem?.value);
  }, [onChange]);

  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect<SelectOption>({ items: options, itemToString, onSelectedItemChange });

  return (
    <div className="select-input-container">
      <label {...getLabelProps()}>{label}</label>
      <button ref={ref} type="button" {...getToggleButtonProps({ onBlur })}>
        {itemToString(selectedItem) || "Select..."}
      </button>
      <ul {...getMenuProps()}>
        {isOpen &&
          options.map((item: SelectOption, index: number) => (
            <li
              style={
                highlightedIndex === index
                  ? { backgroundColor: '#3a3a3a' }
                  : {}
              }
              key={item.name}
              {...getItemProps({ item, index })}
            >
              {itemToString(item)}
            </li>
          ))}
      </ul>
      {error && <ErrorMessage error={error} name={label}/>}
    </div>
  );
});

type FormSelectInputFieldProps<F extends FieldValues> = UseControllerProps<F> & {
  label: string,
  options: SelectOption[],
  error?: ErrorMessageValue,
}

export function FormSelectInputField<F extends FieldValues>({ label, name, control, defaultValue, rules, shouldUnregister, options, error } : FormSelectInputFieldProps<F>) {
  const { field: fieldProps } = useController({ name, control ,defaultValue, rules, shouldUnregister });
  
  return <SelectInputField label={label} {...fieldProps} options={options} error={error} />;
}
