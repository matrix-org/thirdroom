import React from 'react';
import './RootView.css';

import { RootViewModel } from '../../viewModels/RootViewModel';
import { Text } from '../atoms/text/Text';
import { Button } from '../atoms/button/Button';
import { SessionView } from './session/SessionView';
import { LoginView } from './login/LoginView';
import { useVMProp } from '../hooks/useVMProp';

interface IRootView {
  vm: RootViewModel;
}

export function RootView({ vm }: IRootView) {
    const activeSection = useVMProp(vm, 'activeSection');

    return (
        <div className="RootView">
            { activeSection === 'login' && <LoginView vm={vm.loginViewModel!} /> }
            { activeSection === 'session' && <SessionView vm={vm.sessionViewModel!} /> }
            { activeSection === 'loading' && (
                <div className="flex justify-center items-center" style={{ height: '100%' }}>
                    <Text variant="b1" weight="semi-bold">Loading...</Text>
                </div>
            ) }
            { activeSection === 'error' && (
                <div className="flex flex-column justify-center items-center" style={{ height: '100%' }}>
                    <Text variant="b1" weight="semi-bold">This session is invalid</Text>
                    <br />
                    <Button variant="primary" size="small" onClick={() => vm.logout()}>Delete session and login</Button>
                </div>
            ) }
        </div>
    );
}
