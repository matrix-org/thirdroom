import React from "react";
import './InviteView.css';
import { InviteViewModel } from '../../../../viewModels/session/room/InviteViewModel';

interface IInviteView {
  vm: InviteViewModel
}

export function InviteView({
  vm
}: IInviteView) {
  return (
    <div className="InviteView grow">
      Invite
    </div>
  );
}
