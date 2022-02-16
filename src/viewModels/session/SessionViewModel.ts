import {
  Client,
  Session,
  ViewModel,
} from 'hydrogen-view-sdk';

import { LeftPanelViewModel } from './leftpanel/LeftPanelViewModel';

export class SessionViewModel extends ViewModel {
  private _client: typeof Client;
  private _session: typeof Session;
  private _leftPanelViewModel: LeftPanelViewModel;
  
  constructor(options) {
    super(options);
    this._client = options.client;
    this._session = options.client.session;

    this._leftPanelViewModel = new LeftPanelViewModel(this.childOptions({
      client: this._client,
      session: this._session,
    }));
    this.track(this._leftPanelViewModel);
  }

  get leftPanelViewModel() {
    return this._leftPanelViewModel;
  }
}