import {
  Client,
  Session,
  ViewModel,
} from 'hydrogen-view-sdk';

import { LeftPanelViewModel } from './leftpanel/LeftPanelViewModel';
import { RoomViewModel } from './room/RoomViewModel';
import { InviteViewModel } from './room/InviteViewModel';

export class SessionViewModel extends ViewModel {
  private _client: typeof Client;
  private _session: typeof Session;
  private _leftPanelViewModel: LeftPanelViewModel;
  private _roomViewModel: RoomViewModel | null;
  private _inviteViewModel: InviteViewModel | null;
  private _activeRoomId: string | null;
  
  constructor(options) {
    super(options);
    this._client = options.client;
    this._session = options.client.session;
    this._roomViewModel = null;
    this._inviteViewModel = null;
    this._activeRoomId = null;

    this._leftPanelViewModel = new LeftPanelViewModel(this.childOptions({
      client: this._client,
      session: this._session,
    }));
    this.track(this._leftPanelViewModel);
  
    this._setupNavigation();
  }

  private _setupNavigation() {
    const roomObserver = this.navigation.observe('room');
    const unSubscriber = roomObserver.subscribe(() => {
      this._handleRoomView(roomObserver.get());
    });
    this.track(unSubscriber);
    this._handleRoomView(roomObserver.get());
  }

  private _handleRoomView(roomId: string | undefined | boolean) {
    this._roomViewModel = this.disposeTracked(this._roomViewModel);;
    this._inviteViewModel = this.disposeTracked(this._inviteViewModel);;
    this._activeRoomId = null;

    const { rooms, invites } = this._session;
    const roomOrInvite = rooms.get(roomId) || invites.get(roomId);

    if (roomId === undefined || roomOrInvite === undefined) {
      this.emitChange('activeSection');
      this.emitChange('activeRoomId');
      return;
    }

    if (roomOrInvite.isInvite) {
      this._inviteViewModel = new InviteViewModel(this.childOptions({
        invite: roomOrInvite,
      }));
      this.track(this._inviteViewModel);
    } else {
      this._roomViewModel = new RoomViewModel(this.childOptions({
        room: roomOrInvite,
      }));
      this._roomViewModel.load();
      this.track(this._roomViewModel);
    }
    this._activeRoomId = roomOrInvite.id;
    this.emitChange('activeSection');
    this.emitChange('activeRoomId');
  }

  get activeSection() {
    if (this._roomViewModel) return 'room';
    if (this._inviteViewModel) return 'invite';
    return 'none';
  }

  get activeRoomId() {
    return this._activeRoomId;
  }
  
  get leftPanelViewModel() {
    return this._leftPanelViewModel;
  }
  get roomViewModel() {
    return this._roomViewModel;
  }
  get inviteViewModel() {
    return this._inviteViewModel;
  }
}