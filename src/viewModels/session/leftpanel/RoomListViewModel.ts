import {
  Platform,
  URLRouter,
  Navigation,
  ViewModel,
  Room,
  Invite,
  Session,
} from 'hydrogen-view-sdk';

type Options = {
  session: typeof Session
  invites: typeof Invite[]
  rooms: typeof Room[]
  platform: typeof Platform
  urlCreator: typeof URLRouter
  navigation: typeof Navigation
  emitChange?: (params: any) => void
}

export class RoomListViewModel extends ViewModel {
  constructor(options: Options) {
    super(options);
    this._session = options.session;
    this.invites = options.invites;
    this.rooms = options.rooms;

    this.track(
      this.navigation.observe('room').subscribe(() => this.emitChange('activeRoomId'))
    );

    this.track(this.invites.subscribe(this._getRoomChangesHandles()));
    this.track(this.rooms.subscribe(this._getRoomChangesHandles()));
  }

  private _getRoomChangesHandles() {
    const handleChange = () => {
      this.emitChange('allRooms');
    };
    
    return {
      onAdd: handleChange,
      onUpdate: () => undefined,
      onRemove: handleChange,
    }
  }

  getRoomAvatarHttpUrl(roomOrInvite: typeof Room | typeof Invite, size: number) {
    const avatarUrl = roomOrInvite.avatarUrl;
    if (avatarUrl) {
      const imageSize = size * this.platform.devicePixelRatio;
      return this._session.mediaRepository.mxcUrlThumbnail(avatarUrl, imageSize, imageSize, "crop");
    }
    return null;
  }

  get allRooms() {
    const invitedRooms = Array.from(this.invites.values());
    const joinedRooms = Array.from(this.rooms.values());

    return invitedRooms.concat(joinedRooms); 
  }

  get activeRoomId() {
    const segment = this.navigation.path.get('room');
    if (!segment) return null;
    return segment.value;
  }
}
