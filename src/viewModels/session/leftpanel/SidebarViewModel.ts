import { Platform, URLRouter, Navigation, User, ViewModel } from "hydrogen-view-sdk";

type Options = {
  user: typeof User;
  platform: typeof Platform;
  urlCreator: typeof URLRouter;
  navigation: typeof Navigation;
  emitChange?: (params: any) => void;
};

export class SidebarViewModel extends ViewModel {
  constructor(options: Options) {
    super(options);

    this._user = options.user;
  }

  get userId() {
    return this._user.id;
  }
}
