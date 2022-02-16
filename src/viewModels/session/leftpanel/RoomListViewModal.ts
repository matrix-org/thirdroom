import {
  ViewModel,
  Room,
  Invite,
} from 'hydrogen-view-sdk';

export class RoomListViewModel extends ViewModel {
  constructor(options) {
    super(options);
    this._session = options.session;
    this.invites = options.invites;
    this.rooms = options.rooms;
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
}
