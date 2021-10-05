import React, { useCallback } from "react";
import { Modal, ModalProps } from "./Modal";
import {
  ChangeSceneForm,
  ChangeSceneFormFields,
} from "../forms/ChangeSceneForm";
import { Room } from "@robertlong/matrix-js-sdk";
import { useScene } from "../matrix/useScene";

type RoomSettingsModalProps = { room: Room } & Pick<
  ModalProps,
  "isOpen" | "onRequestClose"
>;

export function RoomSettingsModal({
  room,
  isOpen,
  onRequestClose,
}: RoomSettingsModalProps) {
  const { uploadAndChangeScene } = useScene(room);

  const onChangeScene = useCallback(
    (data: ChangeSceneFormFields) => {
      if (data.scene.length > 0) {
        uploadAndChangeScene(data.scene[0]);
      }

      if (onRequestClose) {
        onRequestClose();
      }
    },
    [uploadAndChangeScene]
  );

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <ChangeSceneForm onSubmit={onChangeScene} />
    </Modal>
  );
}
