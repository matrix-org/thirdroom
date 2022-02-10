import React, { useState, useEffect } from "react";

import { RootViewModel } from "../../viewModels/RootViewModel";

import { SessionView } from './SessionView';
import { LoginView } from './LoginView';

import { useVMProp } from '../hooks/useVMProp';

interface IRootView {
  vm: RootViewModel,
};

export function RootView({ vm }: IRootView) {
  const activeSection = useVMProp(vm, 'activeSection');
  
  switch (activeSection) {
    case 'login': return vm.loginViewModel !== null
      ? <LoginView vm={vm.loginViewModel} />
      : <p>failed to load loginViewModel</p>;
    case 'session': return vm.sessionViewModel !== null
      ? <SessionView vm={vm.sessionViewModel} />
      : <p>failed to load sessionViewModel</p>;
    case 'error': return <p>Loading failed</p>;
    default: return <p>Something went wrong!</p>
  }
}
