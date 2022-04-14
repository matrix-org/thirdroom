declare module "hydrogen-view-sdk" {
  export type SubscriptionHandle = () => undefined;

  export abstract class BaseObservable<T> {
    onSubscribeFirst(): void;
    onUnsubscribeLast(): void;
    subscribe(handler: T): SubscriptionHandle;
    unsubscribe(handler?: T): undefined;
    unsubscribeAll(): void;
    get hasSubscriptions(): boolean;
  }

  interface IWaitHandle<T> {
    promise: Promise<T>;
    dispose(): void;
  }

  export abstract class BaseObservableValue<T> extends BaseObservable<(value: T) => void> {
    emit(argument: T): void;
    abstract get(): T;
    waitFor(predicate: (value: T) => boolean): IWaitHandle<T>;
  }

  export class ObservableValue<T> extends BaseObservableValue<T> {
    constructor(initialValue: T);
    get(): T;
    set(value: T): void;
  }

  export class RetainedObservableValue<T> extends ObservableValue<T> {
    constructor(initialValue: T, freeCallback: () => void);
  }

  export interface IMapObserver<K, V> {
    onReset(): void;
    onAdd(key: K, value: V): void;
    onUpdate(key: K, value: V, params: any): void;
    onRemove(key: K, value: V): void;
  }

  export abstract class BaseObservableMap<K, V> extends BaseObservable<IMapObserver<K, V>> {
    emitReset(): void;
    emitAdd(key: K, value: V): void;
    emitUpdate(key: K, value: V, params: any): void;
    emitRemove(key: K, value: V): void;
    abstract [Symbol.iterator](): Iterator<[K, V]>;
    abstract get size(): number;
    abstract get(key: K): V | undefined;
    sortValues(comparator: ListComparator<V>): SortedMapList<V>;
    mapValues<K, V, M>(mapper: Mapper<K, V, M>, updater?: Updater<V, M>): MappedMap<K, V, M>;
    filterValues(filter: (value: V, key: K) => boolean): FilteredMap<K, V>;
    join(...otherMaps: BaseObservableMap<any, any>[]): JoinedMap<any, any>;
  }

  export class ObservableMap<K, V> extends BaseObservableMap<K, V> {
    constructor(initialValues?: (readonly [K, V])[]);
    update(key: K, params?: any): boolean;
    add(key: K, value: V): boolean;
    remove(key: K): boolean;
    set(key: K, value: V): boolean;
    reset(): void;
    get(key: K): V | undefined;
    get size(): number;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    values(): IterableIterator<V>;
    keys(): IterableIterator<K>;
  }

  export type Mapper<K, V, M> = (value: V, emitUpdate: (key: K) => void) => M;
  export type Updater<V, M> = (mappedValue: M, params: any, value: V) => void;

  export class MappedMap<K, V, M> extends BaseObservableMap<K, M> {
    constructor(source: BaseObservableMap<K, V>, mapper: Mapper<K, V, M>, updater?: Updater<V, M>);
    onAdd(key: K, value: V): void;
    onRemove(key: K, value: V): void;
    onUpdate(key: K, value: V, params: any): void;
    onReset(): void;
    get(key: K): M | undefined;
    get size(): number;
    [Symbol.iterator](): IterableIterator<[K, M]>;
  }

  export type Filter<K, V> = (value: V, key: K) => boolean;

  export class FilteredMap<K, V> extends BaseObservableMap<K, V> {
    constructor(source: BaseObservableMap<K, V>, filter: Filter<K, V>);
    setFilter(filter: Filter<K, V>): void;
    onAdd(key: K, value: V): void;
    onRemove(key: K, value: V): void;
    onUpdate(key: K, value: V, params: any): void;
    onReset(): void;
    get(key: K): V | undefined;
    get size(): number;
    [Symbol.iterator](): IterableIterator<[K, V]>;
  }

  export class JoinedMap<K, V> extends BaseObservableMap<K, V> {
    constructor(sources: BaseObservableMap<any, any>[]);
    onAdd(key: K, value: V): void;
    onRemove(key: K, value: V): void;
    onUpdate(key: K, value: V, params: any): void;
    onReset(): void;
    get(key: K): V | undefined;
    get size(): number;
    [Symbol.iterator](): IterableIterator<[K, V]>;
  }

  export interface IListObserver<T> {
    onReset(list: BaseObservableList<T>): void;
    onAdd(index: number, value: T, list: BaseObservableList<T>): void;
    onUpdate(index: number, value: T, params: any, list: BaseObservableList<T>): void;
    onRemove(index: number, value: T, list: BaseObservableList<T>): void;
    onMove(from: number, to: number, value: T, list: BaseObservableList<T>): void;
  }

  export abstract class BaseObservableList<T> extends BaseObservable<IListObserver<T>> implements Iterable<T> {
    emitReset(): void;
    emitAdd(index: number, value: T): void;
    emitUpdate(index: number, value: T, params?: any): void;
    emitRemove(index: number, value: T): void;
    emitMove(fromIdx: number, toIdx: number, value: T): void;
    abstract [Symbol.iterator](): Iterator<T>;
    abstract get length(): number;
  }

  export class ObservableArray<T> extends BaseObservableList<T> {
    constructor(initialValues?: T[]);
    append(item: T): void;
    remove(idx: number): void;
    insertMany(idx: number, items: T[]): void;
    insert(idx: number, item: T): void;
    move(fromIdx: number, toIdx: number): void;
    update(idx: number, item: T, params?: any): void;
    get array(): Readonly<T[]>;
    at(idx: number): T | undefined;
    get length(): number;
    [Symbol.iterator](): IterableIterator<T>;
  }

  export type ListComparator<T> = (a: T, b: T) => number;

  export class SortedMapList<T> extends BaseObservableList<T> {
    constructor(sourceMap: BaseObservableMap<any, T>, comparator: ListComparator<T>);
    onAdd(key: any, value: T): void;
    onRemove(key: any, value: T): void;
    onUpdate(key: any, value: T, params: any): void;
    onReset(): void;
    get(index: number): T;
    get length(): number;
    [Symbol.iterator](): IterableIterator<T>;
  }

  export enum LoadStatus {
    NotLoading = "NotLoading",
    Login = "Login",
    LoginFailed = "LoginFailed",
    QueryAccount = "QueryAccount", // check for dehydrated device after login
    AccountSetup = "AccountSetup", // asked to restore from dehydrated device if present, call sc.accountSetup.finish() to progress to the next stage
    Loading = "Loading",
    SessionSetup = "SessionSetup", // upload e2ee keys, ...
    Migrating = "Migrating", // not used atm, but would fit here
    FirstSync = "FirstSync",
    Error = "Error",
    Ready = "Ready",
  }

  export interface ISessionInfo {
    id: string;
    deviceId: string;
    userId: string;
    homeserver: string;
    /**
     * @deprecated Use homeserver instead
     */
    homeServer: string;
    accessToken: string;
    lastUsed: number;
  }

  export interface ISessionInfoStorage {
    getAll(): Promise<ISessionInfo[]>;
    updateLastUsed(id: string, timestamp: number): Promise<void>;
    get(id: string): Promise<ISessionInfo | undefined>;
    add(sessionInfo: ISessionInfo): Promise<void>;
    delete(sessionId: string): Promise<void>;
  }

  export class Segment {
    type: string;
    value: any;
  }

  export type NavigationAllowsChildHandler = (parent: Segment, child: Segment) => boolean;

  export class Navigation {
    constructor(allowsChild: NavigationAllowsChildHandler);
  }

  export class Platform {
    sessionInfoStorage: ISessionInfoStorage;
    devicePixelRatio: number;
    logger: ILogger;

    config: {
      defaultHomeServer: string;
      [key: string]: any;
    };

    constructor(container: HTMLElement, assetPaths: any, config: any, options?: any, cryptoExtras?: any);

    setNavigation(navigation: Navigation): void;

    dispose(): void;
  }

  export class MediaRepository {
    mxcUrlThumbnail(url: string, width: number, height: number, method: "crop" | "scale"): string | null;
  }

  export enum RoomType {
    DirectMessage,
    Private,
    Public,
  }

  type RoomBeingCreated = any;

  export enum RoomStatus {
    None = 1 << 0,
    BeingCreated = 1 << 1,
    Invited = 1 << 2,
    Joined = 1 << 3,
    Replaced = 1 << 4,
    Archived = 1 << 5,
  }

  export class Session {
    mediaRepository: MediaRepository;
    rooms: ObservableMap<string, Room>;
    createRoom(options: any): RoomBeingCreated;
    observeRoomStatus(roomId: string): Promise<RetainedObservableValue<RoomStatus>>;
  }

  export class LocalMedia {
    withTracks(tracks: any): this;
    withDataChannel(options: any): this;
  }

  enum SyncStatus {
    InitialSync = "InitialSync",
    CatchupSync = "CatchupSync",
    Syncing = "Syncing",
    Stopped = "Stopped",
  }

  export class Sync {
    constructor(options: { hsApi: any; session: Session; storage: any; logger: any });
    get status(): ObservableValue<SyncStatus>;
    get error(): any;
    start(): void;
    stop(): void;
  }

  class ObservedEvent<T> extends BaseObservableValue<T> {
    constructor(eventMap: ObservedEventMap, entry: T, id: string);
    update(entry: T): void;
    get(): T;
  }

  export class ObservedEventMap {
    constructor(notifyEmpty: () => void);
    observe(eventId: string, eventEntry: any): ObservedEvent<any>;
    updateEvents(eventEntries: any[]): void;
  }

  export class Timeline {}

  export class Member {}

  export class MemberList {}

  export interface PowerLevelOptions {
    powerLevelEvent: any;
    createEvent: any;
    ownUserId: any;
    membership: any;
  }

  export class PowerLevels {
    canRedactFromSender(userId: string): boolean;
    canSendType(eventType: string): boolean;
    get canRedact(): boolean;
    getUserLevel(userId: string): number;
  }

  export abstract class RoomKey {
    isForSession(roomId: string, senderKey: string, sessionId: string): boolean;
    abstract get roomId(): string;
    abstract get senderKey(): string;
    abstract get sessionId(): string;
    abstract get claimedEd25519Key(): string;
    abstract get serializationKey(): string;
    abstract get serializationType(): string;
    abstract get eventIds(): string[] | undefined;
    abstract loadInto(session: any, pickleKey: string): void;
    get isBetter(): boolean | undefined;
    set isBetter(value: boolean | undefined);
  }

  export interface RoomOptions {
    roomId: string;
    storage: any;
    hsApi: any;
    mediaRepository: MediaRepository;
    emitCollectionChange: any;
    user: any;
    createRoomEncryption: any;
    getSyncToken: any;
    platform: Platform;
  }

  export class BaseRoom extends EventEmitter<any> {
    constructor(roomOptions: RoomOptions);
    notifyRoomKey(roomKey: RoomKey, eventIds: string[], log?: any): Promise<void>;
    load(summary: any, txn: any, log: any): Promise<void>;
    observeMember(userId: string): Promise<RetainedObservableValue<Member> | null>;
    loadMemberList(log?: any): Promise<MemberList>;
    fillGap(fragmentEntry: any, amount: number, log?: any): Promise<void>;
    get name(): string | null;
    get id(): string;
    get avatarUrl(): string | null;
    get avatarColorId(): string;
    get lastMessageTimestamp(): number;
    get isLowPriority(): boolean;
    get isEncrypted(): boolean;
    get isJoined(): boolean;
    get isLeft(): boolean;
    get canonicalAlias(): string;
    get joinedMemberCount(): number;
    get mediaRepository(): MediaRepository;
    get membership(): any;
    isDirectMessageForUserId(userId: string): boolean;
    observePowerLevels(): Promise<RetainedObservableValue<PowerLevels>>;
    enableKeyBackup(keyBackup: boolean): void;
    openTimeline(log?: any): Promise<Timeline>;
    observeEvent<T = any>(eventId: string): ObservedEvent<T>;
    dispose(): void;
  }

  export class Room extends BaseRoom {}

  export class Client {
    sessionId: string;

    session?: Session;

    sync: Sync;

    loadStatus: ObservableValue<LoadStatus>;

    constructor(platform: Platform);

    startWithExistingSession(sessionId: string): Promise<void>;

    queryLogin(homeserver: string): any;

    startWithLogin(loginMethod: any, options?: { inspectAccountSetup: boolean }): Promise<void>;

    startLogout(sessionId: string): Promise<void>;

    dispose(): void;
  }

  export interface IDisposable {
    dispose(): void;
  }

  export type Disposable = IDisposable | (() => void);

  export class Disposables {
    track<D extends Disposable>(disposable: D): D;
    untrack(disposable: Disposable): undefined;
    dispose(): void;
    get isDisposed(): boolean;
    disposeTracked(value: Disposable | undefined): undefined;
  }

  type Handler<T> = (value?: T) => void;

  export class EventEmitter<T> {
    emit<K extends keyof T>(name: K, value?: T[K]): void;
    disposableOn<K extends keyof T>(name: K, callback: Handler<T[K]>): () => void;
    on<K extends keyof T>(name: K, callback: Handler<T[K]>): void;
    off<K extends keyof T>(name: K, callback: Handler<T[K]>): void;
    onFirstSubscriptionAdded<K extends keyof T>(name: K): void;
    onLastSubscriptionRemoved<K extends keyof T>(name: K): void;
  }

  class Timeout {
    constructor(ms: number);
    elapsed(): Promise<void>;
    abort(): void;
    dispose(): void;
  }

  class Interval {
    constructor(ms: number, callback: () => void);
    dispose(): void;
  }

  class TimeMeasure {
    constructor();
    measure(): number;
  }

  export class Clock {
    createMeasure(): TimeMeasure;
    createTimeout(ms: number): Timeout;
    createInterval(callback: () => void, ms: number): Interval;
    now(): number;
  }

  export type ILogger = any;

  export class URLRouter {
    constructor(options: any);
    attach(): void;
    dispose(): void;
    pushUrl(url: string): void;
    tryRestoreLastUrl(): boolean;
    urlForSegments(segments: string): string;
    urlForSegment(type: string, value: string): string;
    urlUntilSegment(type: string): string;
    urlForPath(path: string): string;
    openRoomActionUrl(roomId: string): string;
    createSSOCallbackURL(): string;
    normalizeUrl(): void;
  }

  export type ViewModelOptions = {
    platform: Platform;
    logger: ILogger;
    urlCreator: URLRouter;
    navigation: Navigation;
    emitChange?: (params: any) => void;
  };

  export class ViewModel<O extends ViewModelOptions = ViewModelOptions> extends EventEmitter<{ change: never }> {
    constructor(options: O);
    childOptions<T extends Object>(explicitOptions: T): T & ViewModelOptions;
    get options(): O;
    getOption<N extends keyof O>(name: N): O[N];
    observeNavigation(type: string, onChange: (value: string | true | undefined, type: string) => void): void;
    track<D extends Disposable>(disposable: D): D;
    untrack(disposable: Disposable): undefined;
    dispose(): void;
    get isDisposed(): boolean;
    disposeTracked(disposable: Disposable | undefined): undefined;
    i18n(parts: TemplateStringsArray, ...expr: any[]): string;
    updateOptions(options: O): void;
    emitChange(changedProps: any): void;
    get platform(): Platform;
    get clock(): Clock;
    get logger(): ILogger;
    get urlCreator(): URLRouter;
    get navigation(): Navigation;
  }

  export interface IRoomViewModel {
    room: Room;
    _room: Room;
    isEncrypted: boolean;
    _createTile(entry: any): SimpleTile | undefined;
    _sendMessage(message: any, replyVM: any): Promise<boolean>;
    _pickAndSendPicture(): void;
    _pickAndSendFile(): void;
    _pickAndSendVideo(): void;
    startReply(entry: any): void;
  }

  export interface SimpleTileOptions extends ViewModelOptions {
    timeline: Timeline;
    roomVM: IRoomViewModel;
  }

  export class SimpleTile extends ViewModel {
    constructor(entry: any, options: SimpleTileOptions);
    get shape(): string | null;
    get isContinuation(): boolean;
    get hasDateSeparator(): boolean;
    get id(): string;
    get eventId(): string;
    get isPending(): boolean;
    get isUnsent(): boolean;
    get canAbortSending(): boolean;
    abortSending(): void;
    setUpdateEmit(emitUpdate: any): void;
    get upperEntry(): any;
    get lowerEntry(): any;
    compare(tile: SimpleTile): number;
    compareEntry(entry: any): number;
    updateEntry(entry: any, param: any): any;
    removeEntry(entry: any): boolean;
    tryIncludeEntry(): boolean;
    updatePreviousSibling(prev: SimpleTile): void;
    updateNextSibling(next: SimpleTile): void;
    notifyVisible(): void;
    dispose(): void;
    get displayName(): string;
    get sender(): string;
  }

  export class GapTile extends SimpleTile {
    constructor(entry: any, options: SimpleTileOptions);
    fill(): boolean;
    notifyVisible(): void;
    get isAtTop(): boolean;
    updatePreviousSibling(prev: any): void;
    updateNextSibling(): void;
    updateEntry(entry: any, params: any): any;
    get shape(): "gap";
    get isLoading(): boolean;
    get error(): string | null;
  }

  export class RoomMemberTile extends SimpleTile {
    constructor(entry: any, options: SimpleTileOptions);
    get shape(): "announcement";
    get announcement(): string;
  }

  export class BaseMessageTile extends SimpleTile {
    constructor(entry: any, options: SimpleTileOptions);
    notifyVisible(): void;
    get permalink(): string;
    get senderProfileLink(): string;
    get displayName(): string;
    get sender(): string;
    get memberPanelLink(): string;
    get avatarColorNumber(): number;
    get avatarUrl(): string | null;
    get avatarLetter(): string;
    get avatarTitle(): string;
    get date(): string | null;
    get time(): string | null;
    get isOwn(): boolean;
    get isContinuation(): boolean;
    get isUnverified(): boolean;
    get isReply(): boolean;
    updatePreviousSibling(prev: any): void;
    updateEntry(entry: any, param: any): any;
    startReply(): void;
    reply(msgtype: string, body: string, log: any): any;
    redact(reason: string, log: any): any;
    get canRedact(): boolean;
    get reactions(): null | any;
    get canReact(): boolean;
    react(key: string, log: any): any;
    redactReaction(key: string, log: any): any;
    toggleReaction(key: string, log: any): any;
    get replyTile(): null | any;
  }

  class BaseTextTile extends BaseMessageTile {
    constructor(entry: any, options: SimpleTileOptions);
    get shape(): "message" | "message-status";
    get body(): null | string;
  }

  class TextTile extends BaseTextTile {
    constructor(entry: any, options: SimpleTileOptions);
    _getPlainBody(): string;
  }

  class EncryptedEventTile extends BaseTextTile {
    constructor(entry: any, params: SimpleTileOptions);
    updateEntry(entry: any, param: any): any;
    get shape(): "message-status";
  }

  export interface TilesCollectionOptions extends SimpleTileOptions {
    tileClassForEntry(entry: any): { new (entry: any, tileOptions: SimpleTileOptions): SimpleTile };
  }

  export class TilesCollection extends BaseObservableList<SimpleTile> {
    constructor(entries: BaseObservableList<any>, tileOptions: TilesCollectionOptions);
    onAdd(index: number, entry: any): void;
    onUpdate(index: number, entry: any, params: any): void;
    onRemove(index: number, entry: any): void;
    onMove(fromIdx: number, toIdx: number, value: any): void;
    get length(): number;
    [Symbol.iterator](): IterableIterator<SimpleTile>;
    getFirst(): SimpleTile;
    getTileIndex(searchTile: SimpleTile): number;
    sliceIterator(start: number, end: number): IterableIterator<SimpleTile>;
  }

  export type TileOptions = SimpleTileOptions & {
    session: Session;
    tileClassForEntry: TileClassForEntryFn;
  };

  export type TileConstructor = new (entry: TimelineEntry, options: TileOptions) => SimpleTile;
  export type TimelineEntry = any;
  export type TileClassForEntryFn = (entry: TimelineEntry) => TileConstructor | undefined;

  export const tileClassForEntry: TileClassForEntryFn;

  export interface TimelineViewModelOptions extends ViewModelOptions {
    timeline: Timeline;
    tileOptions: TileOptions;
  }

  export class TimelineViewModel extends ViewModel {
    constructor(options: TimelineViewModelOptions);
    setVisibleTileRange(startTile: any, endTile: any): void;
    get tiles(): TilesCollection;
    get showJumpDown(): boolean;
  }

  export class ComposerViewModel extends ViewModel {
    constructor(roomVM: IRoomViewModel);
    setReplyingTo(entry: any): void;
    clearReplyingTo(): void;
    get replyViewModel(): SimpleTile;
    get isEncrypted(): boolean;
    sendMessage(message: any): Promise<boolean>;
    sendPicture(): void;
    sendFile(): void;
    sendVideo(): void;
    get canSend(): boolean;
    setInput(text: string): Promise<void>;
    get kind(): string;
  }

  export interface IObservableValue {
    on?(event: "change", handler: (props?: string[]) => void): void;
    off?(event: "change", handler: (props?: string[]) => void): void;
  }

  export interface IMountArgs {
    parentProvidesUpdates?: boolean;
  }

  export type ViewNode = Element | Comment;

  export interface IView {
    mount(args?: IMountArgs): ViewNode;
    root(): ViewNode | undefined;
    unmount(): void;
    update(...args: any[]): void;
  }

  export abstract class BaseUpdateView<T extends IObservableValue> implements IView {
    protected _value: T;
    protected _boundUpdateFromValue: ((props?: string[]) => void) | null;

    abstract mount(args?: IMountArgs): ViewNode;
    abstract root(): ViewNode | undefined;
    abstract update(...args: any[]): void;
    constructor(value: T);
    subscribeOnMount(options?: IMountArgs): void;
    unmount(): void;
    get value(): T;
  }

  export interface TileView extends IView {
    readonly value: SimpleTile;
    onClick(event: UIEvent): void;
  }

  export type TileViewConstructor<T extends SimpleTile = SimpleTile> = new (
    tile: T,
    viewClassForTile?: ViewClassForEntryFn,
    renderFlags?: { reply?: boolean; interactive?: boolean }
  ) => TileView;

  export type ViewClassForEntryFn<T extends SimpleTile = SimpleTile> = (tile: T) => TileViewConstructor<T>;

  export abstract class TemplateView<T extends IObservableValue> extends BaseUpdateView<T> {
    abstract render(t: Builder<T>, value: T): ViewNode;
    mount(options?: IMountArgs): ViewNode;
    unmount(): void;
    root(): ViewNode | undefined;
    update(value: T, props?: string[]): void;
    addSubView(view: IView): void;
    removeSubView(view: IView): void;
    updateSubViews(value: IObservableValue, props: string[]): void;
  }

  export class TemplateBuilder<T extends IObservableValue> {
    constructor(templateView: TemplateView<T>);
    close(): void;
    el(name: string, attributes?: Attributes<T> | Child | Child[], children?: Child | Child[]): ViewNode;
    elNS(ns: string, name: string, attributes?: Attributes<T> | Child | Child[], children?: Child | Child[]): ViewNode;
    view(view: IView, mountOptions?: IMountArgs): ViewNode;
    mapView<R>(mapFn: (value: T) => R, viewCreator: (mapped: R) => IView | null): ViewNode;
    map<R>(mapFn: (value: T) => R, renderFn: (mapped: R, t: Builder<T>, vm: T) => ViewNode): ViewNode;
    ifView(predicate: (value: T) => boolean, viewCreator: (value: T) => IView): ViewNode;
    if(predicate: (value: T) => boolean, renderFn: (t: Builder<T>, vm: T) => ViewNode): ViewNode;
    mapSideEffect<R>(mapFn: (value: T) => R, sideEffect: (newV: R, oldV: R | undefined) => void): void;
  }

  export const HTML_NS = "http://www.w3.org/1999/xhtml";
  export const SVG_NS = "http://www.w3.org/2000/svg";

  export type ClassNames<T> = { [className: string]: boolean | ((value: T) => boolean) };
  export type Child = string | Text | ViewNode;
  export type RenderFn<T> = (t: Builder<T>, vm: T) => ViewNode;
  type EventHandler = (event: Event) => void;
  type AttributeStaticValue = string | boolean;
  type AttributeBinding<T> = (value: T) => AttributeStaticValue;
  export type AttrValue<T> = AttributeStaticValue | AttributeBinding<T> | EventHandler | ClassNames<T>;
  export type Attributes<T> = { [attribute: string]: AttrValue<T> };
  type ElementFn<T> = (attributes?: Attributes<T> | Child | Child[], children?: Child | Child[]) => Element;
  export type Builder<T> = TemplateBuilder<T> & { [tagName: string]: ElementFn<T> };

  export class TimelineView extends TemplateView<TimelineViewModel> {
    constructor(vm: TimelineViewModel, viewClassForTile: ViewClassForEntryFn);
    render(t: Builder<TimelineViewModel>, vm: TimelineViewModel): Element;
    unmount(): void;
  }

  export function viewClassForTile(vm: SimpleTile): TileViewConstructor;

  export class GapView extends TemplateView<GapTile> implements TileView {
    constructor(vm: GapTile);
    render(t: Builder<GapTile>, value: GapTile): ViewNode;
    onClick(): void;
  }

  export type GroupCall = any;
}
