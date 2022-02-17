import {
  Client,
  ViewModel,
} from 'hydrogen-view-sdk';

import { SidebarViewModel } from './SidebarViewModel';
import { RoomListViewModel } from './RoomListViewModal';

export class LeftPanelViewModel extends ViewModel {
  private _client: typeof Client;
  private _sidebarViewModel: SidebarViewModel;
  private _roomListViewModel: RoomListViewModel;
  
  constructor(options) {
    super(options);
    this._client = options.client;
    this._session = options.session;

    this._sidebarViewModel = new SidebarViewModel(this.childOptions({
      user: this._session.user,
    }));
    this.track(this._sidebarViewModel);

    this._roomListViewModel = new RoomListViewModel(this.childOptions({
      session: this._session,
      invites: this._client.session.invites,
      rooms: this._client.session.rooms,
    }));
    this.track(this._roomListViewModel);
  }

  get sidebarViewModel() {
    return this._sidebarViewModel;
  }

  get roomListViewModel() {
    return this._roomListViewModel;
  }
}
