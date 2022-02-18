import {
  RoomViewModel as ChatViewModel,
  ViewModel,
} from 'hydrogen-view-sdk';

export class RoomViewModel extends ViewModel {
  private _chatViewModel: typeof ChatViewModel | null;
  
  constructor(options) {
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

  get chatViewModel() {
    return this._chatViewModel;
  }
}