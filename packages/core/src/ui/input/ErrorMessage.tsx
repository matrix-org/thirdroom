import React, { PropsWithChildren, useEffect } from "react";
import { FieldError } from "react-hook-form";

export type ErrorMessageValue = string | Error | FieldError;

type ErrorMessageProps = PropsWithChildren<{
  name?: string
  error?: ErrorMessageValue
}>

function getErrorTypeMessage(type: string, name?: string) {
  switch (type) {
    case "required":
      return `${name || "This field"} is required.`
    default:
      return "An unknown error ocurred";
  }
}

function getErrorMessage(error?: ErrorMessageValue, name?: string) {
  if (!error || error === "") {
    return "An unknown error ocurred";
  }

  if (typeof error === "string") {
    return error;
  }

  const fieldError = error as FieldError;

  if (fieldError.type) {
    return getErrorTypeMessage(fieldError.type, name);
  }

  if (error.message) {
    return error.message;
  } else {

  }
}

export function ErrorMessage({ name, error, children }: ErrorMessageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <div>{children || getErrorMessage(error, name)}</div>
}
