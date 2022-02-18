import {
  Platform,
  URLRouter,
  Navigation,
  ViewModel,
} from 'hydrogen-view-sdk';

type Options = {
  platform: typeof Platform
  urlCreator: typeof URLRouter
  navigation: typeof Navigation
  emitChange?: (params: any) => void
}

export class InviteViewModel extends ViewModel {
  constructor(options: Options) {
    super(options);
  }
}