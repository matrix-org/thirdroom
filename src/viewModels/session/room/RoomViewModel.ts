import {
  Platform,
  URLRouter,
  Navigation,
  Room,
  RoomViewModel as ChatViewModel,
  ViewModel,
} from 'hydrogen-view-sdk';
import { colorMXID } from '../../colorMXID';

type RoomFlowType = 'preview' | 'load' | 'loaded';

type Options = {
  room: typeof Room
  platform: typeof Platform
  urlCreator: typeof URLRouter
  navigation: typeof Navigation
  emitChange?: (params: any) => void
}

export class RoomViewModel extends ViewModel {
  private _chatViewModel: typeof ChatViewModel | null;
  private _roomFlow: RoomFlowType;
  
  constructor(options: Options) {
    super(options);
    this.room = options.room;
    this._chatViewModel = null;
    this._roomFlow = 'preview';
    this.emitChange('roomFlow');

    this._setupNavigation();
  }

  private _setupNavigation() {
    const lpObserver = this.navigation.observe('left-panel');
    const unSubscriber = lpObserver.subscribe(() => {
      const lpState = lpObserver.get();
      if (lpState === 'initial') this.setRoomFlow('preview');
      if (this.roomFlow === 'load' && lpState !== 'close') this.setRoomFlow('preview');
    });
    this.track(unSubscriber);
  }
  
  async loadChatView() {
    this._chatViewModel = new ChatViewModel(this.childOptions({
      room: this.room,
    }));
    this.track(this._chatViewModel);
    await this._chatViewModel.load();
  }

  private _disposeChatView() {
    this.disposeTracked(this._chatViewModel);
    this._chatViewModel = null;
  }

  setRoomFlow(flow: RoomFlowType) {
    if (this._roomFlow === flow) return;

    if (flow === 'preview') {
      this.toggleLeftPanel('initial');
      if (this._chatViewModel) this._disposeChatView();      
    } else if (flow === 'load') {
      this.toggleLeftPanel('close');
      this.loadChatView().then(() => this.emitChange('chatViewModel'));
    }

    this._roomFlow = flow;
    this.emitChange('roomFlow');
  }

  toggleLeftPanel(state?: 'initial' | 'open' | 'close') {
    const lpState = this.navigation.path.get('left-panel')?.value;
    const stateValue = state ?? (lpState === 'close' ? 'open' : 'close');

    const segment = this.navigation.segment('left-panel', stateValue);
    const path = this.navigation.path.replace(segment);
    this.navigation.applyPath(path);
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

  get roomFlow() {
    return this._roomFlow;
  }

  get name() {
    return this.room.name;
  }
  
  get chatViewModel() {
    return this._chatViewModel;
  }
}