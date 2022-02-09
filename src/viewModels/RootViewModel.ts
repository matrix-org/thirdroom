import {
  Client,
  ViewModel,
  Segment,
} from 'hydrogen-view-sdk';

import { SessionViewModel } from './SessionViewModel';
import { LoginViewModel } from './LoginViewModel';

export class RootViewModel extends ViewModel {
  private _client: typeof Client; 
  private _loginViewModel: LoginViewModel | null;
  private _sessionViewModel: SessionViewModel | null;

  constructor(options) {
    super(options);
    this._loginViewModel = null;
    this._sessionViewModel = null;
    this._client = new Client(options.platform);
  }

  async load() { 
    this.navigation.observe('login').subscribe(() => {
      this._applyNavigation()
      console.log(`navigation changes: login`)
    });
    this.navigation.observe('session').subscribe(() => {
      this._applyNavigation()
      console.log(`navigation changes: session`)
    });
    this._applyNavigation();
  }

  private async _applyNavigation() {
    const loginSegment = this.navigation.path.get('login');
    const sessionSegment = this.navigation.path.get('session');
    console.log(loginSegment, sessionSegment)

    if (loginSegment) {
      this._viewLogin(loginSegment);
    } else if (sessionSegment) {
      this._viewSession(sessionSegment);
    }else {
      const sessions = await this.platform.sessionInfoStorage.getAll();
      if (sessions.length === 0) {
        this.navigation.push('login');
      } else {
        this.navigation.push('session', sessions[0].id);
      }
    };
  }

  private _viewLogin(segment: typeof Segment) {
    this._setSection(() => {
      this._loginViewModel = new LoginViewModel(this.childOptions({
        client: this._client,
        ready: () => {
          this.navigation.push('session');
        }
      }));
    });
  }

  private _viewSession(segment: typeof Segment) {
    // TODO: don't use async await here
    this._setSection(async () => {
      let sessionId = segment.value;
      const sessions = await this.platform.sessionInfoStorage.getAll();
      if (sessionId === true) {
        sessionId = sessions[0].id;
      }
      if (!sessionId || !sessions.find((session: any) => session.id === sessionId)) {
        this.navigation.push('login');
        return;
      }
      // TODO: handle login failed.
      await this._client.startWithExistingSession(sessionId);

      this._sessionViewModel = new SessionViewModel(this.childOptions({
        client: this._client,
      }));
    });
  }

  private async _setSection(setter: () => void) {
        this._loginViewModel = this.disposeTracked(this._loginViewModel);
        this._sessionViewModel = this.disposeTracked(this._sessionViewModel);
        // TODO: Don't use async await here
        await setter();
        this._loginViewModel && this.track(this._loginViewModel);
        this._sessionViewModel && this.track(this._sessionViewModel);
        console.log(this.activeSection);
        this.emitChange('activeSection');
  }
  
  get activeSection() {
    if (this._sessionViewModel) {
        return 'session';
    } else if (this._loginViewModel) {
        return 'login';
    }
    return 'error';
  }

  
  get sessionViewModel() { return this._sessionViewModel; }
  get loginViewModel() { return this._loginViewModel; }
}