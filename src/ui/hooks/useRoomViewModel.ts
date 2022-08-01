import {
  ComposerViewModel,
  IRoomViewModel,
  Room,
  ViewModel,
  TimelineViewModel,
  ViewModelOptions,
  TileOptions,
  TimelineEntry,
  TileConstructor,
  Session,
  GapTile,
  TextTile,
  ImageTile,
  RoomMemberTile,
  EncryptedEventTile,
} from "@thirdroom/hydrogen-view-sdk";
import { useEffect } from "react";

import { useAsync } from "./useAsync";
import { useHydrogen } from "./useHydrogen";

type tileClassForEntryType = (entry: TimelineEntry) => TileConstructor | undefined;

export function chatTileClassForEntry(entry: TimelineEntry): TileConstructor | undefined {
  if (entry.isGap) {
    return GapTile;
  } else if (entry.eventType) {
    switch (entry.eventType) {
      case "m.room.message": {
        if (entry.isRedacted) {
          return undefined;
        }
        const content = entry.content;
        const msgtype = content && content.msgtype;
        switch (msgtype) {
          case "m.text":
          case "m.notice":
          case "m.emote":
            return TextTile;
          case "m.image":
            return ImageTile;
          default:
            // unknown msgtype not rendered
            return undefined;
        }
      }
      case "m.room.member":
        return RoomMemberTile;
      case "m.room.encrypted":
        if (entry.isRedacted) {
          return undefined;
        }
        return EncryptedEventTile;
      default:
        // unknown type not rendered
        return undefined;
    }
  }
}

export function worldChatTileClassForEntry(entry: TimelineEntry): TileConstructor | undefined {
  if (entry.isGap) {
    return GapTile;
  } else if (entry.eventType) {
    switch (entry.eventType) {
      case "m.room.message": {
        if (entry.isRedacted) {
          return undefined;
        }
        const content = entry.content;
        const msgtype = content && content.msgtype;
        switch (msgtype) {
          case "m.text":
          case "m.notice":
          case "m.emote":
            return TextTile;
          default:
            // unknown msgtype not rendered
            return undefined;
        }
      }
      case "m.room.member":
        return RoomMemberTile;
      case "m.room.encrypted":
        if (entry.isRedacted) {
          return undefined;
        }
        return EncryptedEventTile;
      default:
        // unknown type not rendered
        return undefined;
    }
  }
}

interface TRRoomViewModelOptions extends ViewModelOptions {
  room: Room;
  session: Session;
  tileClassForEntry: tileClassForEntryType;
}

export class TRRoomViewModel extends ViewModel implements IRoomViewModel {
  public _room: Room;
  private _session: Session;
  private _timelineVM: TimelineViewModel | null;
  private _composerVM: ComposerViewModel;
  private _tileClassForEntry: tileClassForEntryType;
  private _tileOptions?: TileOptions;

  constructor(options: TRRoomViewModelOptions) {
    super(options);
    const { room, session, tileClassForEntry } = options;
    this._session = session;
    this._room = room;
    this._tileClassForEntry = tileClassForEntry;
    this._timelineVM = null;
    this._composerVM = new ComposerViewModel(this);
  }

  async load() {
    let timeline;
    if (this._room._timeline) {
      timeline = this._room._timeline;
    } else {
      timeline = await this._room.openTimeline();
    }
    this._tileOptions = this.childOptions({
      session: this._session,
      roomVM: this,
      timeline,
      tileClassForEntry: this._tileClassForEntry,
    });

    // NOTE: We are not tracking TimelineViewModel to dispose
    // Cause when it dispose it also closes timeline of current room
    this._timelineVM = new TimelineViewModel(
      this.childOptions({
        tileOptions: this._tileOptions,
        timeline,
      })
    );
  }

  dispose() {
    super.dispose();
  }

  _createTile(entry: any) {
    if (this._tileOptions) {
      const Tile = this._tileClassForEntry(entry);
      if (Tile) {
        return new Tile(entry, this._tileOptions);
      }
    }
  }

  async _sendMessage(message: string): Promise<boolean> {
    if (!message) return false;
    try {
      let msgtype = "m.text";
      if (message.startsWith("/me ")) {
        message = message.slice(4).trim();
        msgtype = "m.emote";
      }
      await this._room.sendEvent("m.room.message", { msgtype, body: message });
      return true;
    } catch {
      return false;
    }
  }

  async _pickAndSendFile() {}

  async _sendFile() {}

  async _pickAndSendVideo() {}

  async _pickAndSendPicture() {}

  get room() {
    return this._room;
  }

  get composerViewModel() {
    return this._composerVM;
  }

  get timelineViewModel() {
    return this._timelineVM;
  }

  get isEncrypted(): boolean {
    return this._room.isEncrypted;
  }

  startReply(entry: any) {}
}

export function useRoomViewModel(room: Room, tileClassForEntry: tileClassForEntryType) {
  const { platform, logger, session, urlRouter, navigation } = useHydrogen(true);

  const {
    loading,
    error,
    value: roomViewModel,
  } = useAsync(async () => {
    const roomViewModel = new TRRoomViewModel({
      session,
      room,
      tileClassForEntry,
      platform,
      logger,
      urlCreator: urlRouter,
      navigation,
    });

    await roomViewModel.load();

    return roomViewModel;
  }, [room, session, platform, logger, urlRouter, navigation]);

  useEffect(
    () => () => {
      if (roomViewModel) {
        roomViewModel.dispose();
      }
    },
    [roomViewModel]
  );

  return { loading, error, roomViewModel };
}
