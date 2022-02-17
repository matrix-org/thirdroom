import {
  ViewModel,
} from 'hydrogen-view-sdk';

export class SidebarViewModel extends ViewModel {
  constructor(options) {
    super(options);

    this._user = options.user;
  }

  get userId() {
    return this._user.id;
  }
}
