import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import {
  ChangeAvatarForm,
  ChangeAvatarFormFields,
} from "../forms/ChangeAvatarForm";
import { useProfile } from "../matrix/useProfile";
import { Modal, ModalProps } from "./Modal";

type ProfileModalProps = Pick<ModalProps, "isOpen" | "onRequestClose">;

export function ProfileModal({ isOpen, onRequestClose }: ProfileModalProps) {
  const history = useHistory();
  const { avatarUrl, uploadAndChangeAvatar } = useProfile();

  const onChangeAvatar = useCallback(
    (data: ChangeAvatarFormFields) => {
      if (data.avatar.length > 0) {
        uploadAndChangeAvatar(data.avatar[0]);
      }
    },
    [uploadAndChangeAvatar]
  );

  const onClose = useCallback(() => {
    history.push("..");
  }, []);

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <h1>Profile</h1>
      <p>
        <b>Avatar Url:</b> {avatarUrl}
      </p>
      <h3>Change Avatar</h3>
      <ChangeAvatarForm onSubmit={onChangeAvatar} />
    </Modal>
  );
}
