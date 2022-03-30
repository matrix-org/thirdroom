import {
    Platform,
    URLRouter,
    Navigation,
    Segment,
    Client,
    ViewModel,
} from 'hydrogen-view-sdk';

import { SessionViewModel } from './session/SessionViewModel';
import { LoginViewModel } from './login/LoginViewModel';

type Options = {
  platform: typeof Platform;
  urlCreator: typeof URLRouter;
  navigation: typeof Navigation;
  emitChange?: (params: any) => void;
};

export class RootViewModel extends ViewModel {
    private _client: typeof Client;
    private _loginViewModel: LoginViewModel | null;
    private _sessionViewModel: SessionViewModel | null;
    private _error: boolean;

    constructor(options: Options) {
        super(options);
        this._loginViewModel = null;
        this._sessionViewModel = null;
        this._error = false;

        this._client = new Client(options.platform);
        this.track(this._client);
    }

    async load() {
        this.track(this.navigation.observe('login').subscribe((value: any) => this._applyNavigation(value, 'login')));
        this.track(this.navigation.observe('session').subscribe((value: any) => this._applyNavigation(value, 'session')));
        const loginSegment = this.navigation.path.get('login');
        const sessionSegment = this.navigation.path.get('session');

        const activeSegment: typeof Segment = loginSegment || sessionSegment;
        if (activeSegment) {
            this._applyNavigation(activeSegment.value, activeSegment.type);
        } else {
            this._applyNavigation(undefined, undefined);
        }
    }

    private async _applyNavigation(value: any, type: string | undefined) {
        const sessions = await this.platform.sessionInfoStorage.getAll();

        if (type === 'login' && sessions.length === 0) {
            this._viewLogin();
            return;
        }
        if (type === 'session' && sessions.length > 0) {
            const sessionId = sessions[0].id;
            if (value !== sessionId) {
                this.navigation.push('session', sessionId);
                return;
            }

            await this._client.startWithExistingSession(sessionId);
            if (this._client.loadStatus.get() === 'Error') {
                this._viewError();
                return;
            }
            this._viewSession();
            return;
        }

        if (sessions.length > 0) {
            this.navigation.push('session', sessions[0].id);
        } else {
            this.navigation.push('login');
        }
    }

    private _viewLogin() {
        this._setSection(() => {
            this._loginViewModel = new LoginViewModel(this.childOptions({
                client: this._client,
                ready: (sessionId: string) => {
                    this.navigation.push('session', sessionId);
                },
            }));
        });
    }

    private _viewSession() {
        this._setSection(() => {
            this._sessionViewModel = new SessionViewModel(this.childOptions({
                client: this._client,
            }));
        });
    }

    private _viewError() {
        this._setSection(() => {
            this._error = true;
        });
    }

    private _setSection(setter: () => void) {
        this._error = false;
        this._loginViewModel = this.disposeTracked(this._loginViewModel);
        this._sessionViewModel = this.disposeTracked(this._sessionViewModel);
        setter();
        this._loginViewModel && this.track(this._loginViewModel);
        this._sessionViewModel && this.track(this._sessionViewModel);

        this.emitChange('activeSection');
    }

    async logout() {
        await this._client.startLogout(this._client.sessionId);
        this.navigation.push('login');
    }

    get activeSection() {
        if (this._sessionViewModel) return 'session';
        if (this._loginViewModel) return 'login';
        if (this._error) return 'error';
        return 'loading';
    }

    get sessionViewModel() { return this._sessionViewModel; }
    get loginViewModel() { return this._loginViewModel; }
}
