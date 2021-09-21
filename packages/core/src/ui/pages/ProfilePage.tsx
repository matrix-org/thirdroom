import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { ChangeAvatarForm, ChangeAvatarFormFields } from "../forms/ChangeAvatarForm";
import { useProfile } from "../matrix/useProfile";

export function ProfilePage() {
  const { avatarUrl, uploadAndChangeAvatar } = useProfile();

  const onChangeAvatar = useCallback(
    (data: ChangeAvatarFormFields) => {
      if (data.avatar.length > 0) {
        uploadAndChangeAvatar(data.avatar[0]);
      }
    },
    [uploadAndChangeAvatar]
  );

  return (
    <div>
      <h1>Profile</h1>
      <Link to="/">Back to dashboard</Link>
      <p><b>Avatar Url:</b> {avatarUrl}</p>
      <h3>Change Avatar</h3>
      <ChangeAvatarForm onSubmit={onChangeAvatar} />
    </div>
  );
}