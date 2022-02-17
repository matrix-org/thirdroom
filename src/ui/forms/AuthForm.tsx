import React, { useCallback, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../input/Button";
import { InputField } from "../input/InputField";
import { ErrorMessage } from "../input/ErrorMessage";

interface AuthFormFields {
  userName: string,
  password: string
}

interface AuthFormProps {
  onSubmit: SubmitHandler<AuthFormFields>,
  submitLabel: string
  submittingLabel: string,
}

export function AuthForm({ onSubmit, submitLabel, submittingLabel }: AuthFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const [error, setError] = useState<Error | null>(null);

  const onError = useCallback((error) => {
    setError(error);
  }, []);

  return (
    <form onSubmit={(e) => handleSubmit(onSubmit)(e).catch(onError)}>
      <InputField className="input-field" disabled={isSubmitting} label="Username" error={errors.userName} {...register("userName", { required: true })} />
      <InputField className="input-field" disabled={isSubmitting}  label="Password" type="password" error={errors.password} {...register("password", { required: true })} />
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
      <Button disabled={isSubmitting} type="submit">{isSubmitting ? submittingLabel : submitLabel}</Button>
    </form>
  );
}