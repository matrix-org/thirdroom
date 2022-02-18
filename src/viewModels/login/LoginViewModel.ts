import {
  Platform,
  URLRouter,
  Navigation,
  Client,
  ViewModel,
} from 'hydrogen-view-sdk';

type Options = {
  client: typeof Client
  platform: typeof Platform
  urlCreator: typeof URLRouter
  navigation: typeof Navigation
  emitChange?: (params: any) => void
}

export class LoginViewModel extends ViewModel {
  private _client: typeof Client;
  
  constructor(options: Options) {
    super(options);
    this._client = options.client;
  }

  async login(homeserver: string, username: string, password: string) {
    const loginOptions = await this._client.queryLogin(homeserver).result;
    await this._client.startWithLogin(loginOptions.password(username, password));
    this._options.ready();
  }
  
  get defaultHomeserver() {
    return this.platform.config.defaultHomeserver;
  }
}