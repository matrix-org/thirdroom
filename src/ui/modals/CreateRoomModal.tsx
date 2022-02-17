import React, { useCallback, useContext } from "react";
import { Modal, ModalProps } from "./Modal";
import { useHistory } from "react-router-dom";
import { CreateRoomForm, CreateRoomFormFields } from "../forms/CreateRoomForm";
import { ClientContext } from "../matrix/ClientContext";
import { createRoom } from "../matrix/createRoom";

type CreateRoomModalProps = Pick<ModalProps, "isOpen" | "onRequestClose">;

export function CreateRoomModal({
  isOpen,
  onRequestClose,
}: CreateRoomModalProps) {
  const history = useHistory();
  const { client } = useContext(ClientContext);

  const onSubmit = useCallback(
    async ({ name, scene, roomAccess, alias }: CreateRoomFormFields) => {
      if (!client) {
        throw new Error("Client not initialized");
      }

      const sceneFile = scene.length > 0 ? scene[0] : undefined;

      const room = await createRoom(client, {
        name,
        scene: sceneFile,
        roomAccess,
        alias,
      });

      const roomId = room.getCanonicalAlias() || room.roomId;

      history.push(`/room/${roomId}`);
    },
    [client]
  );

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <div className="create-room-container">
        <div className="container-content">
          <h1>Create Room</h1>
          <CreateRoomForm onSubmit={onSubmit} />
        </div>
      </div>
    </Modal>
  );
}
