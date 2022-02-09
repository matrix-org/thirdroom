import React from "react";

import { SessionViewModel } from '../../viewModels/SessionViewModel';

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {
  return (
    <p>Session view</p>
  );
}
