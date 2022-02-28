import {
  Platform,
  URLRouter,
  Navigation,
  Room,
  RoomViewModel as ChatViewModel,
  ViewModel,
} from 'hydrogen-view-sdk';
import { colorMXID } from '../../colorMXID';

type Options = {
  room: typeof Room
  platform: typeof Platform
  urlCreator: typeof URLRouter
  navigation: typeof Navigation
  emitChange?: (params: any) => void
}

export class RoomViewModel extends ViewModel {
  private _chatViewModel: typeof ChatViewModel | null;
  
  constructor(options: Options) {
    super(options);
    this.room = options.room;
    this._chatViewModel = null;
  }

  async load() {
    this._chatViewModel = new ChatViewModel(this.childOptions({
      room: this.room,
    }));
    this.track(this._chatViewModel);
    this._chatViewModel.load();
  }

  
  getRoomColor() {
    const { avatarColorId } = this.room;
    return colorMXID(avatarColorId);
  }

  getRoomAvatarHttpUrl(size?: number) {
    const { avatarUrl, mediaRepository } = this.room;
    if (avatarUrl) {
      if (!size) return mediaRepository.mxcUrl(avatarUrl);
      const imageSize = size * this.platform.devicePixelRatio;
      return mediaRepository.mxcUrlThumbnail(avatarUrl, imageSize, imageSize, "crop");
    }
    return null;
  }

  get name() {
    return this.room.name;
  }
  
  get chatViewModel() {
    return this._chatViewModel;
  }
}