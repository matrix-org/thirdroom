import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../input/Button";
import { ErrorMessage } from "../input/ErrorMessage";
import { InputField } from "../input/InputField";
import { FormSelectInputField, SelectOption } from "../input/SelectInputField";
import { RoomAccess } from "../matrix/createRoom";

export interface CreateRoomFormFields {
  name: string;
  scene: FileList;
  roomAccess: RoomAccess;
  alias: string;
}

const RoomAccessOptions: SelectOption[] = [
  { name: "Invite Only", value: RoomAccess.InviteOnly },
  { name: "Registered Users", value: RoomAccess.RegisteredUsers },
  { name: "Guests", value: RoomAccess.Guests },
];

interface CreateRoomFormProps {
  onSubmit: SubmitHandler<CreateRoomFormFields>
}

export function CreateRoomForm({ onSubmit }: CreateRoomFormProps) {
  const {
    watch,
    handleSubmit,
    register,
    control,
    formState: { isSubmitting, errors },
  } = useForm();
  const [error, setError] = useState<Error | null>(null);
  const roomAccess = watch("roomAccess");

  return (
      <form onSubmit={(e) => handleSubmit(onSubmit)(e).catch(setError)}>
        <InputField
          type="string"
		  className="input-field"
          autoComplete="off"
          label="Room Name"
          error={errors.name}
          {...register("name", { required: true })}
        />
        <InputField
          label="Scene glTF"
		  className="input-field"
          type="file"
          accept="model/gltf-binary"
          error={errors.scene}
          {...register("scene")}
        />
        <FormSelectInputField
          label="Room Access"
          name="roomAccess"
          options={RoomAccessOptions}
          control={control}
          rules={{ required: true }}
          error={errors.roomAccess}
        />
        {roomAccess === RoomAccess.RegisteredUsers && (
          <InputField
            prefix="#"
			className="input-field"
            postfix={`:${location.hostname}`}
            label="Room Alias"
            placeholder="example"
            error={errors.roomAlias}
            {...register("alias")}
          />
        )}
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <Button disabled={isSubmitting} type="submit">
          Create Room
        </Button>
      </form>
  );
}
