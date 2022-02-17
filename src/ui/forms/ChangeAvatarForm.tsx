import React, { useCallback, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../input/Button";
import { InputField } from "../input/InputField";
import { ErrorMessage } from "../input/ErrorMessage";

export interface ChangeAvatarFormFields {
  avatar: FileList
}

interface ChangeAvatarFormProps {
  onSubmit: SubmitHandler<ChangeAvatarFormFields>,
}

export function ChangeAvatarForm({ onSubmit }: ChangeAvatarFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangeAvatarFormFields>();

  const [error, setError] = useState<Error | null>(null);

  const onError = useCallback((error) => {
    setError(error);
  }, []);

  return (
    <form onSubmit={(e) => handleSubmit(onSubmit)(e).catch(onError)}>
      <InputField
        label="Avatar glTF"
        type="file"
        accept="model/gltf-binary"
        error={errors.avatar}
        {...register("avatar", { required: true })}
      />
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
      <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Uploading avatar..." : "Change Avatar"}</Button>
    </form>
  );
}