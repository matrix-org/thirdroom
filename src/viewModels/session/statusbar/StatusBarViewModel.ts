import { Platform, URLRouter, Navigation, Client, Session, ViewModel } from "hydrogen-view-sdk";

type Options = {
  client: typeof Client;
  session: typeof Session;
  platform: typeof Platform;
  urlCreator: typeof URLRouter;
  navigation: typeof Navigation;
  emitChange?: (params: any) => void;
};

export class StatusBarViewModel extends ViewModel {
  constructor(options: Options) {
    super(options);
    this._rooms = options.session.rooms;
    this._overlayBtnVisibility = false;
    this._leftPanelState = "initial";
    this._selectedRoom = undefined;

    this._setupNavigation();
  }

  private _setupNavigation() {
    const lpObserver = this.navigation.observe("left-panel");
    const unSubscriber1 = lpObserver.subscribe(() => {
      const lpState = lpObserver.get();
      if (lpState === "initial") {
        this._overlayBtnVisibility = false;
      } else {
        this._overlayBtnVisibility = true;
      }
      this._leftPanelState = lpState;
      this.emitChange("overlayBtnVisibility");
      this.emitChange("leftPanelState");
    });
    this.track(unSubscriber1);

    const roomObserver = this.navigation.observe("room");
    const unSubscriber2 = roomObserver.subscribe(() => {
      const roomId = roomObserver.get();
      this._selectedRoom = this._rooms.get(roomId);
      this._overlayBtnVisibility = false;
      this._leftPanelVisibility = "initial";

      this.emitChange("overlayBtnVisibility");
      this.emitChange("leftPanelState");
      this.emitChange("selectedRoomName");
    });
    this.track(unSubscriber2);
  }

  toggleLeftPanel(state?: "initial" | "open" | "close") {
    const lpState = this.navigation.path.get("left-panel")?.value;
    const stateValue = state ?? (lpState === "close" ? "open" : "close");

    const segment = this.navigation.segment("left-panel", stateValue);
    const path = this.navigation.path.replace(segment);
    this.navigation.applyPath(path);
  }

  get selectedRoomName() {
    if (!this._selectedRoom) return undefined;
    return this._selectedRoom.name || "Empty room";
  }
  get overlayBtnVisibility() {
    return this._overlayBtnVisibility;
  }
  get leftPanelState() {
    return this._leftPanelState;
  }
}
