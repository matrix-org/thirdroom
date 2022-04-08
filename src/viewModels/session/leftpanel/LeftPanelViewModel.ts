import { Platform, URLRouter, Navigation, Client, Session, ViewModel } from "hydrogen-view-sdk";

import { SidebarViewModel } from "./SidebarViewModel";
import { RoomListViewModel } from "./RoomListViewModel";

type Options = {
  client: typeof Client;
  session: typeof Session;
  platform: typeof Platform;
  urlCreator: typeof URLRouter;
  navigation: typeof Navigation;
  emitChange?: (params: any) => void;
};

export class LeftPanelViewModel extends ViewModel {
  private _client: typeof Client;
  private _sidebarViewModel: SidebarViewModel;
  private _roomListViewModel: RoomListViewModel;
  private _panelState: "initial" | "open" | "close";

  constructor(options: Options) {
    super(options);
    this._client = options.client;
    this._session = options.session;

    this._sidebarViewModel = new SidebarViewModel(
      this.childOptions({
        user: this._session.user,
      })
    );
    this.track(this._sidebarViewModel);

    this._roomListViewModel = new RoomListViewModel(
      this.childOptions({
        session: this._session,
        invites: this._client.session.invites,
        rooms: this._client.session.rooms,
      })
    );
    this.track(this._roomListViewModel);

    this._panelState = "initial";
    this.navigation.push("left-panel", "initial");
    this._setupNavigation();
  }

  private _setupNavigation() {
    this.track(
      this.navigation.observe("left-panel").subscribe(() => {
        const segment = this.navigation.path.get("left-panel");
        this._handlePanelState(segment.value);
      })
    );

    this.track(
      this.navigation.observe("room").subscribe(() => {
        this._handlePanelState("initial");
      })
    );
  }

  private _handlePanelState(state?: "initial" | "open" | "close") {
    if (typeof state === "string") this._panelState = state;
    else this._panelState = "initial";

    this.emitChange("panelState");
  }

  get sidebarViewModel() {
    return this._sidebarViewModel;
  }

  get roomListViewModel() {
    return this._roomListViewModel;
  }

  get panelState() {
    return this._panelState;
  }
}
