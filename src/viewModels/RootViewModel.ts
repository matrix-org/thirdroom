import {
  Platform,
  URLRouter,
  Navigation,
  Client,
  ViewModel,
} from 'hydrogen-view-sdk';

import { SessionViewModel } from './session/SessionViewModel';
import { LoginViewModel } from './login/LoginViewModel';

type Options = {
  platform: typeof Platform
  urlCreator: typeof URLRouter
  navigation: typeof Navigation
  emitChange?: (params: any) => void
}

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
    this.track(this.navigation.observe('login').subscribe(() => this._applyNavigation()));
    this.track(this.navigation.observe('session').subscribe(() => this._applyNavigation()));
    this._applyNavigation();
  }

  private async _applyNavigation() {
    const loginSegment = this.navigation.path.get('login');
    const sessionSegment = this.navigation.path.get('session');

    const sessions = await this.platform.sessionInfoStorage.getAll();
    
    if (loginSegment) {
      if (sessions.length > 0) {
        this.navigation.push('session', sessions[0].id);
        return;
      }
      this._viewLogin();
      return;
    }
    if (sessionSegment && sessions[0]) {
      const sessionId = sessions[0].id;
      console.log(sessionSegment)
      if (sessionSegment.value !== sessionId) {
        this.navigation.push('session', sessionId);
        return;
      }

      await this._client.startWithExistingSession(sessionId);
      if (this._client.loadStatus.get() === 'Error') {
        this._error = true;
        this.emitChange('activeSection');
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
        }
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

  private _setSection(setter: () => void) {
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