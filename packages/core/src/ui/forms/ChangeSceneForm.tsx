import React, { useCallback, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../input/Button";
import { InputField } from "../input/InputField";
import { ErrorMessage } from "../input/ErrorMessage";

export interface ChangeSceneFormFields {
  scene: FileList
}

interface ChangeSceneFormProps {
  onSubmit: SubmitHandler<ChangeSceneFormFields>,
}

export function ChangeSceneForm({ onSubmit }: ChangeSceneFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const [error, setError] = useState<Error | null>(null);

  const onError = useCallback((error) => {
    setError(error);
  }, []);

  return (
    <form onSubmit={(e) => handleSubmit(onSubmit)(e).catch(onError)}>
      <InputField
        label="Scene glTF"
        type="file"
        accept="model/gltf-binary"
        error={errors.scene}
        {...register("scene", { required: true })}
      />
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
      <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Uploading scene..." : "Change Scene"}</Button>
    </form>
  );
}