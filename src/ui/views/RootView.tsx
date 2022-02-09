import React, { useState, useEffect } from "react";

import { RootViewModel } from "../../viewModels/RoomViewModel";

import { SessionView } from './SessionView';
import { LoginView } from './LoginView';

interface IRootView {
  vm: RootViewModel,
};

export function RootView({ vm }: IRootView) {
  const [activeSection, setActiveSection] = useState(vm.activeSection);

  useEffect(() => {
    const dispose = vm.disposableOn('change', (changedProp: string) => {
      console.log(changedProp, ': ', vm.activeSection);
      if (changedProp === 'activeSection') {
        setActiveSection(vm.activeSection);
      }
    });

    return () => dispose();
  }, [vm]);
  
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
