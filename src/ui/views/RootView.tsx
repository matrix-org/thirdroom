import React from "react";
import './RootView.css';

import { RootViewModel } from "../../viewModels/RootViewModel";

import { Text } from "../atoms/text/Text";
import { SessionView } from './SessionView';
import { LoginView } from './LoginView';

import { useVMProp } from '../hooks/useVMProp';

interface IRootView {
  vm: RootViewModel,
};

export function RootView({ vm }: IRootView) {
  const activeSection = useVMProp(vm, 'activeSection');
  
  return (
    <div className="RootView">
      {activeSection === 'login' && <LoginView vm={vm.loginViewModel!} />}
      {activeSection === 'session' && <SessionView vm={vm.sessionViewModel!} />}
      {activeSection === 'error' && <Text>Error occurred</Text>}
    </div>
  );
}
