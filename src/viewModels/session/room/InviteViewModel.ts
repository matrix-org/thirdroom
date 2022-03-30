import { Invite, Platform, URLRouter, Navigation, ViewModel } from "hydrogen-view-sdk";

import { colorMXID } from "../../colorMXID";

type Options = {
  invite: typeof Invite;
  platform: typeof Platform;
  urlCreator: typeof URLRouter;
  navigation: typeof Navigation;
  emitChange?: (params: any) => void;
};

export class InviteViewModel extends ViewModel {
  constructor(options: Options) {
    super(options);

    this.invite = options.invite;
  }

  getRoomColor() {
    const { avatarColorId } = this.invite;
    return colorMXID(avatarColorId);
  }

  getRoomAvatarHttpUrl(size?: number) {
    const { avatarUrl, mediaRepository } = this.invite;
    if (avatarUrl) {
      if (!size) return mediaRepository.mxcUrl(avatarUrl);
      const imageSize = size * this.platform.devicePixelRatio;
      return mediaRepository.mxcUrlThumbnail(avatarUrl, imageSize, imageSize, "crop");
    }
    return null;
  }

  get name() {
    return this.invite.name;
  }
}
