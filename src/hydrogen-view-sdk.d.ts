/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "@matrix-org/olm" {
  export class Account {
    constructor();
    free(): void;
    create(): void;
    identity_keys(): string;
    sign(message: string | Uint8Array): string;
    one_time_keys(): string;
    mark_keys_as_published(): void;
    max_number_of_one_time_keys(): number;
    generate_one_time_keys(number_of_keys: number): void;
    remove_one_time_keys(session: Session): void;
    generate_fallback_key(): void;
    fallback_key(): string;
    pickle(key: string | Uint8Array): string;
    unpickle(key: string | Uint8Array, pickle: string): void;
  }

  export class Session {
    constructor();
    free(): void;
    pickle(key: string | Uint8Array): string;
    unpickle(key: string | Uint8Array, pickle: string): void;
    create_outbound(account: Account, their_identity_key: string, their_one_time_key: string): void;
    create_inbound(account: Account, one_time_key_message: string): void;
    create_inbound_from(account: Account, identity_key: string, one_time_key_message: string): void;
    session_id(): string;
    has_received_message(): boolean;
    matches_inbound(one_time_key_message: string): boolean;
    matches_inbound_from(identity_key: string, one_time_key_message: string): boolean;
    encrypt(plaintext: string): object;
    decrypt(message_type: number, message: string): string;
    describe(): string;
  }

  export class Utility {
    constructor();
    free(): void;
    sha256(input: string | Uint8Array): string;
    ed25519_verify(key: string, message: string | Uint8Array, signature: string): void;
  }

  export class InboundGroupSession {
    constructor();
    free(): void;
    pickle(key: string | Uint8Array): string;
    unpickle(key: string | Uint8Array, pickle: string): void;
    create(session_key: string): string;
    import_session(session_key: string): string;
    decrypt(message: string): object;
    session_id(): string;
    first_known_index(): number;
    export_session(message_index: number): string;
  }

  export class OutboundGroupSession {
    constructor();
    free(): void;
    pickle(key: string | Uint8Array): string;
    unpickle(key: string | Uint8Array, pickle: string): void;
    create(): void;
    encrypt(plaintext: string): string;
    session_id(): string;
    session_key(): string;
    message_index(): number;
  }

  export class PkEncryption {
    constructor();
    free(): void;
    set_recipient_key(key: string): void;
    encrypt(plaintext: string): object;
  }

  export class PkDecryption {
    constructor();
    free(): void;
    init_with_private_key(key: Uint8Array): string;
    generate_key(): string;
    get_private_key(): Uint8Array;
    pickle(key: string | Uint8Array): string;
    unpickle(key: string | Uint8Array, pickle: string): string;
    decrypt(ephemeral_key: string, mac: string, ciphertext: string): string;
  }

  export class PkSigning {
    constructor();
    free(): void;
    init_with_seed(seed: Uint8Array): string;
    generate_seed(): Uint8Array;
    sign(message: string): string;
  }

  export class SAS {
    constructor();
    free(): void;
    get_pubkey(): string;
    set_their_key(their_key: string): void;
    generate_bytes(info: string, length: number): Uint8Array;
    calculate_mac(input: string, info: string): string;
    calculate_mac_long_kdf(input: string, info: string): string;
  }

  export function init(opts?: object): Promise<void>;

  export function get_library_version(): [number, number, number];

  export const PRIVATE_KEY_LENGTH: number;
}

declare module "@thirdroom/hydrogen-view-sdk" {
  import type * as Olm from "@matrix-org/olm";

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

  export class ConcatList<T> extends BaseObservableList<T> implements IListObserver<T> {
    constructor(sourceList: BaseObservableList<T>[]);
    onSubscribeFirst(): void;
    onUnsubscribeLast(): void;
    onReset(): void;
    onAdd(index: number, value: T, list: BaseObservableList<T>): void;
    onUpdate(index: number, value: T, params: any, list: BaseObservableList<T>): void;
    onRemove(index: number, value: T, list: BaseObservableList<T>): void;
    onMove(from: number, to: number, value: T, list: BaseObservableList<T>): void;
    get length(): number;
    [Symbol.iterator](): IterableIterator<T>;
  }

  export enum LoginFailure {
    Connection = "Connection",
    Credentials = "Credentials",
    Unknown = "Unknown",
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

  export interface IBlobHandle {
    nativeBlob: Blob;
    url: string;
    size: number;
    mimeType: string;
    readAsBuffer(): BufferSource;
    dispose(): void;
  }
  export class SettingsStorage {
    constructor(prefix: string);
    setInt(key: string, value: number): Promise<void>;
    getInt(keyL: string, defaultValue?: number): Promise<number | null>;
    setBool(key: string, value: boolean): Promise<void>;
    getBool(key: string, defaultValue?: boolean): Promise<boolean | null>;
    setString(key: string, value: string): Promise<string>;
    getString(key: string): Promise<string | null>;
    remove(key: string): Promise<void>;
  }
  export class Platform {
    sessionInfoStorage: ISessionInfoStorage;
    settingsStorage: SettingsStorage;
    devicePixelRatio: number;
    logger: ILogger;

    mediaDevices: MediaDevices;

    config: {
      defaultHomeServer: string;
      [key: string]: any;
    };
    encoding: any;
    request: any;
    crypto?: any;

    constructor(options: { container: HTMLElement; assetPaths: any; config: any; options?: any; cryptoExtras?: any });

    setNavigation(navigation: Navigation): void;
    openFile(mimeType: string): Promise<
      | {
          name: string;
          blob: IBlobHandle;
        }
      | undefined
    >;
    openUrl(url: string): void;

    dispose(): void;
  }

  type AuthorizationParams = {
    state: string;
    scope: string;
    redirectUri: string;
    nonce?: string;
    codeVerifier?: string;
  };
  type BearerToken = {
    token_type: "Bearer";
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  type IssuerUri = string;
  interface ClientConfig {
    client_id: string;
    client_secret?: string;
    uris: string[];
  }
  export class OidcApi {
    constructor(options: {
      issuer: string;
      clientConfigs: Record<IssuerUri, ClientConfig>;
      request: RequestFunction;
      encoding: any;
      crypto: any;
      urlCreator: URLRouter;
      clientId?: string;
    });
    get clientMetadata(): {
      client_name: string;
      logo_uri: string;
      client_uri: string;
      tos_uri: string;
      policy_uri: string;
      response_types: string[];
      grant_types: string[];
      redirect_uris: string[];
      id_token_signed_response_alg: string;
      token_endpoint_auth_method: string;
    };
    get metadataUrl(): string;
    get issuer(): string;
    clientId(): Promise<string>;
    registration(): Promise<any>;
    metadata(): Promise<any>;
    validate(): Promise<void>;
    authorizationEndpoint(prams: AuthorizationParams): Promise<string>;
    tokenEndpoint(): Promise<string>;
    registrationEndpoint(): Promise<string>;
    revocationEndpoint(): Promise<string | undefined>;
    generateDeviceScope(): string;
    generateParams({ scope, redirectUri }: { scope: string; redirectUri: string }): AuthorizationParams;
    completeAuthorizationCodeGrant({
      codeVerifier,
      code,
      redirectUri,
    }: {
      codeVerifier: string;
      code: string;
      redirectUri: string;
    }): Promise<BearerToken>;
    refreshToken({ refreshToken }: { refreshToken: string }): Promise<BearerToken>;
    revokeToken({ token, type }: { token: string; type: "refresh" | "access" }): Promise<void>;
  }

  interface ILoginMethod {
    homeserver: string;
    login(hsApi: HomeServerApi, deviceName: string, log: ILogItem): Promise<Record<string, any>>;
  }
  export class OIDCLoginMethod implements ILoginMethod {
    public readonly homeserver: string;
    constructor(options: {
      nonce: string;
      code: string;
      codeVerifier: string;
      homeserver: string;
      redirectUri: string;
      oidcApi: OidcApi;
      accountManagementUrl?: string;
    });
    login(hsApi: HomeServerApi, _deviceName: string, log: ILogItem): Promise<Record<string, any>>;
  }

  export class MediaRepository {
    mxcUrlThumbnail(url: string, width: number, height: number, method: "crop" | "scale"): string | null;
    mxcUrl(url: string): string | undefined;
  }

  export enum RoomVisibility {
    DirectMessage,
    Private,
    Public,
  }

  export enum RoomType {
    World,
    Profile,
  }

  export class RoomBeingCreated extends EventEmitter<any> {
    public readonly id: string;
    public readonly mediaRepository: MediaRepository;
    public readonly platform: Platform;
    get avatarColorId(): string;
    get avatarUrl(): string | undefined;
    get avatarBlobUrl(): string | undefined;
    get roomId(): string | undefined;
    get name(): string;
    get isBeingCreated(): boolean;
    get error(): Error | undefined;
    cancel(): void;
  }

  export enum RoomStatus {
    None = 1 << 0,
    BeingCreated = 1 << 1,
    Invited = 1 << 2,
    Joined = 1 << 3,
    Replaced = 1 << 4,
    Archived = 1 << 5,
  }

  type ImageInfo = {
    w: number;
    h: number;
    mimetype: string;
    size: number;
  };

  type Avatar = {
    info: ImageInfo;
    name?: string;
  } & ({ blob: IBlobHandle } | { url: string });

  interface ICreateRoom {
    type?: RoomType;
    visibility: RoomVisibility;
    name?: string;
    topic?: string;
    invites?: string[];
    isEncrypted?: boolean;
    isFederationDisabled?: boolean;
    alias?: string;
    avatar?: Avatar;
    powerLevelContentOverride?: any;
    initialState?: any[];
  }

  export interface RoomStateHandler {
    handleRoomState(room: Room, stateEvent: StateEvent, syncWriteTxn: Transaction, log: ILogItem): void;
    updateRoomMembers(room: Room, memberChanges: Map<string, MemberChange>): void;
  }

  export interface StateObserver {
    handleStateEvent(event: StateEvent): void;
    load(roomId: string, txn: Transaction): Promise<void>;
    setRemoveCallback(callback: () => void): void;
  }

  export class ObservedStateTypeMap extends ObservableMap<string, StateEvent> implements StateObserver {
    constructor(type: string);
    load(roomId: string, txn: Transaction): Promise<void>;
    handleStateEvent(event: StateEvent): void;
    setRemoveCallback(callback: () => void): void;
    onUnsubscribeLast(): void;
  }
  export class ObservedStateKeyValue extends BaseObservableValue<StateEvent | undefined> implements StateObserver {
    constructor(type: string, stateKey: string);
    load(roomId: string, txn: Transaction): Promise<void>;
    handleStateEvent(event: StateEvent): void;
    get(): StateEvent | undefined;
    setRemoveCallback(callback: () => void): void;
    onUnsubscribeLast(): void;
  }

  export interface IFilteredSessionInfo {
    id: string;
    deviceId: string;
    userId: string;
    homeserver: string;
    accountManagementUrl?: string;
  }
  export class Session {
    userId: string;
    sessionInfo: IFilteredSessionInfo;
    hsApi: HomeServerApi;
    mediaRepository: MediaRepository;
    rooms: ObservableMap<string, Room>;
    invites: ObservableMap<string, Invite>;
    roomsBeingCreated: ObservableMap<string, RoomBeingCreated>;
    callHandler: CallHandler;
    createRoom(options: ICreateRoom): RoomBeingCreated;
    joinRoom(roomIdOrAlias: string, log?: ILogger): Promise<string>;
    observeRoomState(handler: RoomStateHandler): () => void;
    observeRoomStatus(roomId: string): Promise<RetainedObservableValue<RoomStatus>>;
    getAccountData(type: string): Promise<any>;
    setAccountData(type: string, content: any): Promise<void>;
  }

  export class LocalMedia {
    readonly userMedia?: Stream | undefined;
    readonly screenShare?: Stream | undefined;
    readonly dataChannelOptions?: RTCDataChannelInit | undefined;
    constructor(
      userMedia?: Stream | undefined,
      screenShare?: Stream | undefined,
      dataChannelOptions?: RTCDataChannelInit | undefined
    );
    withUserMedia(stream: Stream): LocalMedia;
    withScreenShare(stream: Stream): LocalMedia;
    withDataChannel(options: RTCDataChannelInit): LocalMedia;
    clone(): LocalMedia;
    dispose(): void;
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

  export interface FragmentIdComparer {
    compare: (a: number, b: number) => number;
  }

  export abstract class BaseEntry {
    constructor(fragmentIdComparer: FragmentIdComparer);
    abstract get fragmentId(): number;
    abstract get entryIndex(): number;
    compare(otherEntry: BaseEntry): number;
    asEventKey(): any;
  }
  export class BaseEventEntry extends BaseEntry {
    constructor(fragmentIdComparer: FragmentIdComparer);
    get fragmentId(): number;
    get entryIndex(): number;
    get isReply(): boolean;
    get isRedacting(): boolean;
    get isRedacted(): boolean;
    get isRedaction(): boolean;
    get redactionReason(): string | null;
    setContextEntry(entry: any): void;
    get contextForEntries(): any;
    get contextEntry(): any;
    addLocalRelation(entry: any): undefined | string;
    removeLocalRelation(entry: any): undefined | string;
    abortPendingRedaction(): Promise<void>;
    get pendingRedaction(): any;
    annotate(key: string): any;
    reply(msgtype: string, body: string): string;
    isRelatedToId(id: string): boolean;
    haveAnnotation(key: string): boolean;
    get relation(): boolean;
    get pendingAnnotations(): any;
    get annotations(): null;
  }

  export class EventEntry extends BaseEventEntry {
    constructor(eventEntry: any, fragmentIdComparer: FragmentIdComparer);
    clone(): EventEntry;
    updateFrom(other: BaseEntry): void;
    get event(): any;
    get fragmentId(): number;
    get entryIndex(): number;
    get content(): any;
    get prevContent(): any;
    get eventType(): string;
    get stateKey(): string;
    get sender(): string;
    get displayName(): string | undefined;
    get avatarUrl(): string | undefined;
    get timestamp(): number;
    get id(): string;
    setDecryptionResult(result: any): void;
    get isEncrypted(): boolean;
    get isDecrypted(): boolean;
    get isVerified(): boolean;
    get isUnverified(): boolean;
    setDecryptionError(err: any): void;
    get decryptionError(): any;
    get relatedEventId(): string;
    get isRedacted(): boolean;
    get redactionReason(): string | null;
    get annotations(): any;
    get relation(): any;
    get contextEventId(): string | null;
  }

  export class PendingEventEntry extends BaseEventEntry {
    constructor(options: any);
    get fragmentId(): number;
    get entryIndex(): number;
    get content(): any;
    get event(): null;
    get eventType(): string;
    get stateKey(): null;
    get sender(): string | undefined;
    get displayName(): string | undefined;
    get avatarUrl(): string | undefined;
    get timestamp(): number;
    get isPending(): true;
    get id(): string;
    get pendingEvent(): any;
    notifyUpdate(): void;
    isRelatedToId(id: any): boolean;
    get relatedEventId(): string;
    get redactingEntry(): any;
    get contextEventId(): string | null;
  }

  export class Direction {
    constructor(isForward: boolean);
    private readonly isForward: boolean;
    get isBackward(): boolean;
    asApiString(): string;
    reverse(): Direction;
    static get Forward(): Direction;
    static get Backward(): Direction;
  }
  export class FragmentBoundaryEntry extends BaseEntry {
    constructor(fragment: any, isFragmentStart: boolean, fragmentIdComparer: FragmentIdComparer);
    static start(fragment: any, fragmentIdComparer: FragmentIdComparer): FragmentBoundaryEntry;
    static end(fragment: any, fragmentIdComparer: FragmentIdComparer): FragmentBoundaryEntry;
    get started(): boolean;
    get hasEnded(): boolean;
    get fragment(): any;
    get fragmentId(): number;
    get entryIndex(): number;
    get isGap(): boolean;
    get token(): string | null;
    set token(token);
    get edgeReached(): boolean;
    set edgeReached(reached);
    get linkedFragmentId(): null | number;
    set linkedFragmentId(id);
    get hasLinkedFragment(): boolean;
    get direction(): Direction;
    withUpdatedFragment(fragment: any): FragmentBoundaryEntry;
    createNeighbourEntry(neighbour: any): FragmentBoundaryEntry;

    addLocalRelation(): void;
    removeLocalRelation(): void;
  }

  export class Timeline {
    constructor(options: any);
    initializePowerLevels(observable: any): void;
    loadAtTop(amount: number): boolean;
    getByEventId(eventId: string): EventEntry;
    get entries(): ConcatList<EventEntry | PendingEventEntry | FragmentBoundaryEntry>;
    dispose(): void;
  }

  export class RoomMember {
    get roomId(): string;
    get userId(): string;
    get name(): string;
    get displayName(): string | undefined;
    get avatarUrl(): string | undefined;
    get membership(): string;
  }

  export class RetainedValue {
    constructor(freeCallback: () => void);
    retain(): void;
    release(): void;
  }

  export class MemberList extends RetainedValue {
    constructor({ members, closeCallback }: { members: void; closeCallback: () => void });
    afterSync(memberChanges: any): void;
    get members(): ObservableMap<string, RoomMember>;
  }

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

  export class AttachmentUpload {
    constructor({ filename, blob, platform }: { filename: string; blob: IBlobHandle; platform: Platform });
    get size(): number;
    get sentBytes(): number;
    abort(): void;
    get localPreview(): Blob;
    encrypt(): Promise<void>;
    upload(hsApi: HomeServerApi, progressCallback: () => void, log?: any): Promise<void>;
    applyToContent(urlPath: string, content: {}): void;
    dispose(): void;
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
  export interface InviteOptions {
    roomId: string;
    user: any;
    hsApi: HomeServerApi;
    mediaRepository: MediaRepository;
    emitCollectionRemove: any;
    emitCollectionUpdate: any;
    platform: Platform;
  }

  export class Invite extends EventEmitter<any> {
    constructor(options: InviteOptions);
    get isInvite(): true;
    get id(): string;
    get name(): string;
    get isDirectMessage(): boolean;
    get avatarUrl(): string | null;
    get avatarColorId(): string;
    get type(): string | undefined;
    get timestamp(): number;
    get isEncrypted(): boolean;
    get inviter(): RoomMember;
    isDirectMessageForUserId(userId: string): boolean;
    get isPublic(): boolean;
    get canonicalAlias(): string | null;
    accept(log?: any): Promise<void>;
    reject(log?: any): Promise<void>;
    get accepting(): boolean;
    get accepted(): boolean;
    get rejecting(): boolean;
    get rejected(): boolean;
    get mediaRepository(): MediaRepository;
    load(inviteData: any, log: any): void;
  }

  export class BaseRoom extends EventEmitter<any> {
    constructor(roomOptions: RoomOptions);
    observeStateType(type: string, txn?: string): Promise<ObservedStateTypeMap>;
    observeStateTypeAndKey(type: string, stateKey: string, txn?: string): Promise<ObservedStateKeyValue>;
    getStateEvent(type: string, key?: string): Promise<RoomStateEntry | undefined>;
    notifyRoomKey(roomKey: RoomKey, eventIds: string[], log?: any): Promise<void>;
    load(summary: any, txn: any, log: any): Promise<void>;
    observeMember(userId: string): Promise<RetainedObservableValue<RoomMember> | null>;
    loadMemberList(log?: any): Promise<MemberList>;
    fillGap(fragmentEntry: any, amount: number, log?: any): Promise<void>;
    get name(): string | null;
    get id(): string;
    get avatarUrl(): string | null;
    get avatarColorId(): string;
    get type(): string | undefined;
    get lastMessageTimestamp(): number;
    get isLowPriority(): boolean;
    get isEncrypted(): boolean;
    get isJoined(): boolean;
    get isLeft(): boolean;
    get canonicalAlias(): string | null;
    get joinedMemberCount(): number;
    get mediaRepository(): MediaRepository;
    get membership(): any;
    get isDirectMessage(): boolean;
    isDirectMessageForUserId(userId: string): boolean;
    observePowerLevels(): Promise<RetainedObservableValue<PowerLevels>>;
    enableKeyBackup(keyBackup: boolean): void;
    openTimeline(log?: any): Promise<Timeline>;
    observeEvent<T = any>(eventId: string): ObservedEvent<T>;
    dispose(): void;
  }

  export class Room extends BaseRoom {
    _timeline: any;
    constructor(roomOptions: RoomOptions);
    sendEvent(eventType: string, content: any, attachments?: any, log?: any): Promise<void>;
    sendRedaction(eventIdOrTxnId: string, reason: string, log?: any): Promise<void>;
    ensureMessageKeyIsShared(log?: any): Promise<any>;
    get avatarColorId(): string;
    get isUnread(): boolean;
    get notificationCount(): number;
    get highlightCount(): number;
    get isTrackingMembers(): boolean;
    clearUnread(log?: any): Promise<void>;
    leave(log?: any): Promise<void>;
    createAttachment(blob: Blob, filename: string): AttachmentUpload;
    dispose(): void;
  }

  export interface IAbortable {
    abort(): void;
  }
  type SetAbortableFn = (a: IAbortable) => typeof a;
  type SetProgressFn<P> = (progress: P) => void;
  type RunFn<T, P> = (setAbortable: SetAbortableFn, setProgress: SetProgressFn<P>) => T;

  export class AbortableOperation<T, P = void> implements IAbortable {
    readonly result: T;
    constructor(run: RunFn<T, P>);
    get progress(): BaseObservableValue<P | undefined>;
    abort(): void;
  }

  export interface QueryOIDCResult {
    account: string;
    issuer: string;
  }
  export interface QueryLoginResult {
    homeserver: string;
    oidc?: QueryOIDCResult;
    password?: (username: string, password: string) => ILoginMethod;
    token?: (loginToken: string) => ILoginMethod;
  }

  export interface ClientOptions {
    deviceName?: string;
  }

  export class Client {
    sessionId: string;

    session?: Session;

    sync: Sync;

    loadStatus: ObservableValue<LoadStatus>;

    constructor(platform: Platform, options?: ClientOptions);
    get loginFailure(): LoginFailure;

    startWithExistingSession(sessionId: string): Promise<void>;

    queryLogin(homeserver: string): AbortableOperation<QueryLoginResult>;

    startWithLogin(loginMethod: ILoginMethod, options?: { inspectAccountSetup: boolean }): Promise<void>;

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
    createOIDCRedirectURL(): string;
    absoluteAppUrl(): string;
    absoluteUrlForAsset(asset: string): string;
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
    avatarUrl(size: number): string | null;
    get avatarLetter(): string;
    get avatarTitle(): string;
    get date(): string | null;
    get time(): string | null;
    get isOwn(): boolean;
    get isContinuation(): boolean;
    get isUnverified(): boolean;
    get isReply(): boolean;
    _getContent(): any;
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
    get body(): any;
  }

  export class TextTile extends BaseTextTile {
    constructor(entry: any, options: SimpleTileOptions);
    _getPlainBody(): string;
  }

  export class EncryptedEventTile extends BaseTextTile {
    constructor(entry: any, params: SimpleTileOptions);
    updateEntry(entry: any, param: any): any;
    get shape(): "message-status";
  }

  export class BaseMediaTile extends BaseMessageTile {
    constructor(entry: any, options: SimpleTileOptions);
    get isUploading(): boolean;
    get uploadPercentage(): number | any;
    get sendStatus(): string;
    get thumbnailUrl(): string;
    notifyVisible(): void;
    get width(): number;
    get height(): number;
    get mimeType(): string | undefined;
    get label(): any;
    get error(): string | null;
    setViewError(err: string): void;
  }

  export class ImageTile extends BaseMediaTile {
    constructor(entry: any, options: SimpleTileOptions);
    get lightboxUrl(): string;
    get shape(): "image";
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
    sendMessage(message: string): Promise<boolean>;
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
    el(name: string, attributes?: Attributes<T> | Children<T>, children?: Children<T>): ViewNode;
    elNS(ns: string, name: string, attributes?: Attributes<T> | Children<T>, children?: Children<T>): ViewNode;
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
  type TextBinding<T> = (v: T) => string | number | boolean | undefined | null;
  export type Child<T> = string | Text | ViewNode | TextBinding<T>;
  export type Children<T> = Child<T> | Child<T>[];
  export type RenderFn<T extends IObservableValue> = (t: Builder<T>, vm: T) => ViewNode;
  type EventHandler = (event: Event) => void;
  type AttributeStaticValue = string | boolean;
  type AttributeBinding<T> = (value: T) => AttributeStaticValue;
  export type AttrValue<T> = AttributeStaticValue | AttributeBinding<T> | EventHandler | ClassNames<T>;
  export type Attributes<T> = { [attribute: string]: AttrValue<T> };
  type ElementFn<T> = (attributes?: Attributes<T> | Children<T>, children?: Children<T>) => Element;
  export type Builder<T extends IObservableValue> = TemplateBuilder<T> & { [tagName: string]: ElementFn<T> };

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

  export enum LogLevel {
    All = 1,
    Debug = 2,
    Detail = 3,
    Info = 4,
    Warn = 5,
    Error = 6,
    Fatal = 7,
    Off = 8,
  }
  export class LogFilter {
    private _min?;
    private _parentFilter?;
    constructor(parentFilter?: LogFilter);
    filter(item: ILogItem, children: ISerializedItem[] | null): boolean;
    minLevel(logLevel: LogLevel): LogFilter;
  }

  export interface ISerializedItem {
    s: number;
    d?: number;
    v: LogItemValues;
    l: LogLevel;
    e?: {
      stack?: string;
      name: string;
      message: string;
    };
    f?: boolean;
    c?: Array<ISerializedItem>;
  }
  export interface ILogItem {
    logLevel: LogLevel;
    error?: Error;
    readonly logger: ILogger;
    readonly level: typeof LogLevel;
    readonly end?: number;
    readonly start?: number;
    readonly values: LogItemValues;
    wrap<T>(
      labelOrValues: LabelOrValues,
      callback: LogCallback<T>,
      logLevel?: LogLevel,
      filterCreator?: FilterCreator
    ): T;
    log(labelOrValues: LabelOrValues, logLevel?: LogLevel): ILogItem;
    set(key: string | object, value: unknown): ILogItem;
    runDetached(
      labelOrValues: LabelOrValues,
      callback: LogCallback<unknown>,
      logLevel?: LogLevel,
      filterCreator?: FilterCreator
    ): ILogItem;
    wrapDetached(
      labelOrValues: LabelOrValues,
      callback: LogCallback<unknown>,
      logLevel?: LogLevel,
      filterCreator?: FilterCreator
    ): void;
    refDetached(logItem: ILogItem, logLevel?: LogLevel): void;
    ensureRefId(): void;
    catch(err: Error): Error;
    serialize(filter: LogFilter, parentStartTime: number | undefined, forced: boolean): ISerializedItem | undefined;
    finish(): void;
    forceFinish(): void;
    child(labelOrValues: LabelOrValues, logLevel?: LogLevel, filterCreator?: FilterCreator): ILogItem;
  }
  export interface ILogger {
    log(labelOrValues: LabelOrValues, logLevel?: LogLevel): void;
    child(labelOrValues: LabelOrValues, logLevel?: LogLevel, filterCreator?: FilterCreator): ILogItem;
    wrapOrRun<T>(
      item: ILogItem | undefined,
      labelOrValues: LabelOrValues,
      callback: LogCallback<T>,
      logLevel?: LogLevel,
      filterCreator?: FilterCreator
    ): T;
    runDetached<T>(
      labelOrValues: LabelOrValues,
      callback: LogCallback<T>,
      logLevel?: LogLevel,
      filterCreator?: FilterCreator
    ): ILogItem;
    run<T>(
      labelOrValues: LabelOrValues,
      callback: LogCallback<T>,
      logLevel?: LogLevel,
      filterCreator?: FilterCreator
    ): T;
    export(): Promise<ILogExport | undefined>;
    get level(): typeof LogLevel;
  }

  type BlobHandle = any;

  export interface ILogExport {
    get count(): number;
    removeFromStore(): Promise<void>;
    asBlob(): BlobHandle;
  }
  export type LogItemValues = {
    l?: string;
    t?: string;
    id?: unknown;
    status?: string | number;
    refId?: number;
    ref?: number;
    [key: string]: any;
  };
  export type LabelOrValues = string | LogItemValues;
  export type FilterCreator = (filter: LogFilter, item: ILogItem) => LogFilter;
  export type LogCallback<T> = (item: ILogItem) => T;

  export type EncodedBody = {
    mimeType: string;
    body: BlobHandle | string;
  };
  export function encodeQueryParams(queryParams?: object): string;
  export function encodeBody(body: BlobHandle | object): EncodedBody;

  export class RequestResult {
    constructor(promise: Promise<{ status: number; body: any }>, controller: AbortController);
    abort(): void;
    response(): Promise<{ status: number; body: any }>;
  }

  export interface IRequestOptions {
    uploadProgress?: (loadedBytes: number) => void;
    timeout?: number;
    body?: EncodedBody;
    headers?: Map<string, string | number>;
    cache?: boolean;
    method?: string;
    format?: string;
  }
  export type RequestFunction = (url: string, options: IRequestOptions) => RequestResult;

  export type File = {
    readonly name: string;
    readonly blob: IBlobHandle;
  };
  export interface Timeout {
    elapsed(): Promise<void>;
    abort(): void;
    dispose(): void;
  }
  export type TimeoutCreator = (timeout: number) => Timeout;

  export interface MediaDevices {
    enumerate(): Promise<MediaDeviceInfo[]>;
    getMediaTracks(audio: true | MediaDeviceInfo, video: boolean | MediaDeviceInfo): Promise<Stream>;
    getScreenShareTrack(): Promise<Stream | undefined>;
  }
  export interface Stream extends MediaStream {
    readonly audioTrack: AudioTrack | undefined;
    readonly videoTrack: Track | undefined;
    readonly id: string;
    clone(): Stream;
  }
  export enum TrackKind {
    Video = "video",
    Audio = "audio",
  }
  export interface Track {
    readonly kind: TrackKind;
    readonly label: string;
    readonly id: string;
    readonly settings: MediaTrackSettings;
    stop(): void;
  }
  export interface AudioTrack extends Track {
    get isSpeaking(): boolean;
  }

  export interface WebRTC {
    createPeerConnection(
      handler: PeerConnectionHandler,
      forceTURN: boolean,
      turnServers: RTCIceServer[],
      iceCandidatePoolSize: number
    ): PeerConnection;
  }
  export interface StreamSender {
    get stream(): Stream;
    get audioSender(): TrackSender | undefined;
    get videoSender(): TrackSender | undefined;
  }
  export interface StreamReceiver {
    get stream(): Stream;
    get audioReceiver(): TrackReceiver | undefined;
    get videoReceiver(): TrackReceiver | undefined;
  }
  export interface TrackReceiver {
    get track(): Track;
    get enabled(): boolean;
    enable(enabled: boolean): any;
  }
  export interface TrackSender extends TrackReceiver {
    /** replaces the track if possible without renegotiation. Can throw. */
    replaceTrack(track: Track | undefined): Promise<void>;
    /** make any needed adjustments to the sender or transceiver settings
     * depending on the purpose, after adding the track to the connection */
    prepareForPurpose(purpose: SDPStreamMetadataPurpose): void;
  }
  export interface PeerConnectionHandler {
    onIceConnectionStateChange(state: RTCIceConnectionState): any;
    onLocalIceCandidate(candidate: RTCIceCandidate): any;
    onIceGatheringStateChange(state: RTCIceGatheringState): any;
    onRemoteStreamRemoved(stream: Stream): any;
    onRemoteTracksAdded(receiver: TrackReceiver): any;
    onRemoteDataChannel(dataChannel: any | undefined): any;
    onNegotiationNeeded(): any;
  }
  export interface PeerConnection {
    get iceGatheringState(): RTCIceGatheringState;
    get signalingState(): RTCSignalingState;
    get localDescription(): RTCSessionDescription | undefined;
    get localStreams(): ReadonlyMap<string, StreamSender>;
    get remoteStreams(): ReadonlyMap<string, StreamReceiver>;
    createOffer(): Promise<RTCSessionDescriptionInit>;
    createAnswer(): Promise<RTCSessionDescriptionInit>;
    setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
    addTrack(track: Track): TrackSender | undefined;
    removeTrack(track: TrackSender): void;
    createDataChannel(options: RTCDataChannelInit): any;
    dispose(): void;
    close(): void;
  }

  export type PeerCallOptions = {
    webRTC: WebRTC;
    forceTURN: boolean;
    turnServers: RTCIceServer[];
    createTimeout: TimeoutCreator;
    emitUpdate: (peerCall: PeerCall, params: any) => void;
    sendSignallingMessage: (message: SignallingMessage<MCallBase>, log: ILogItem) => Promise<void>;
  };
  export class RemoteMedia {
    userMedia?: Stream | undefined;
    screenShare?: Stream | undefined;
    constructor(userMedia?: Stream | undefined, screenShare?: Stream | undefined);
  }
  /**
   * Does WebRTC signalling for a single PeerConnection, and deals with WebRTC wrappers from platform
   * */
  /** Implements a call between two peers with the signalling state keeping, while still delegating the signalling message sending. Used by GroupCall.*/
  export class PeerCall implements IDisposable {
    private callId;
    private readonly options;
    private readonly logItem;
    private readonly peerConnection;
    private _state;
    private direction;
    private localMedia?;
    private seq;
    private candidateSendQueue;
    private remoteCandidateBuffer?;
    private remoteSDPStreamMetadata?;
    private responsePromiseChain?;
    private opponentPartyId?;
    private hangupParty;
    private disposables;
    private statePromiseMap;
    private makingOffer;
    private ignoreOffer;
    private sentEndOfCandidates;
    private iceDisconnectedTimeout?;
    private _dataChannel?;
    private _hangupReason?;
    private _remoteMedia;
    constructor(callId: string, options: PeerCallOptions, logItem: ILogItem);
    get dataChannel(): any | undefined;
    get state(): CallState;
    get hangupReason(): CallErrorCode | undefined;
    get remoteMedia(): Readonly<RemoteMedia>;
    call(localMedia: LocalMedia): Promise<void>;
    answer(localMedia: LocalMedia): Promise<void>;
    setMedia(localMedia: LocalMedia, logItem?: ILogItem): Promise<void>;
    /** group calls would handle reject at the group call level, not at the peer call level */
    reject(): Promise<void>;
    hangup(errorCode: CallErrorCode): Promise<void>;
    private _hangup;
    handleIncomingSignallingMessage<B extends MCallBase>(
      message: SignallingMessage<B>,
      partyId: PartyId
    ): Promise<void>;
    private sendHangupWithCallId;
    private handleNegotiation;
    private handleInviteGlare;
    private handleHangupReceived;
    private handleFirstInvite;
    private handleInvite;
    private handleAnswer;
    private handleIceGatheringState;
    private handleLocalIceCandidate;
    private handleRemoteIceCandidates;
    private sendAnswer;
    private queueCandidate;
    private sendCandidateQueue;
    private updateRemoteSDPStreamMetadata;
    private addBufferedIceCandidates;
    private addIceCandidates;
    private onIceConnectionStateChange;
    private setState;
    private waitForState;
    private terminate;
    private getSDPMetadata;
    private updateRemoteMedia;
    private delay;
    private sendSignallingMessage;
    dispose(): void;
    close(reason: CallErrorCode | undefined, log: ILogItem): void;
  }
  type PartyId = string | null;
  export enum CallParty {
    Local = "local",
    Remote = "remote",
  }
  export enum CallState {
    Fledgling = "fledgling",
    CreateOffer = "create_offer",
    InviteSent = "invite_sent",
    CreateAnswer = "create_answer",
    Connecting = "connecting",
    Connected = "connected",
    Ringing = "ringing",
    Ended = "ended",
  }
  export enum CallDirection {
    Inbound = "inbound",
    Outbound = "outbound",
  }

  export class CallError extends Error {
    code: string;
    constructor(code: CallErrorCode, msg: string, err: Error);
  }

  export enum EventType {
    GroupCall = "org.matrix.msc3401.call",
    GroupCallMember = "org.matrix.msc3401.call.member",
    Invite = "m.call.invite",
    Candidates = "m.call.candidates",
    Answer = "m.call.answer",
    Hangup = "m.call.hangup",
    Reject = "m.call.reject",
    SelectAnswer = "m.call.select_answer",
    Negotiate = "m.call.negotiate",
    SDPStreamMetadataChanged = "m.call.sdp_stream_metadata_changed",
    SDPStreamMetadataChangedPrefix = "org.matrix.call.sdp_stream_metadata_changed",
    Replaces = "m.call.replaces",
    AssertedIdentity = "m.call.asserted_identity",
    AssertedIdentityPrefix = "org.matrix.call.asserted_identity",
  }
  export const SDPStreamMetadataKey = "org.matrix.msc3077.sdp_stream_metadata";
  export interface CallDeviceMembership {
    device_id: string;
    session_id: string;
  }
  export interface CallMembership {
    ["m.call_id"]: string;
    ["m.devices"]: CallDeviceMembership[];
  }
  export interface CallMemberContent {
    ["m.calls"]: CallMembership[];
  }
  export interface SessionDescription {
    sdp?: string;
    type: RTCSdpType;
  }
  export enum SDPStreamMetadataPurpose {
    Usermedia = "m.usermedia",
    Screenshare = "m.screenshare",
  }
  export interface SDPStreamMetadataObject {
    purpose: SDPStreamMetadataPurpose;
    audio_muted: boolean;
    video_muted: boolean;
  }
  export interface SDPStreamMetadata {
    [key: string]: SDPStreamMetadataObject;
  }
  export interface CallCapabilities {
    "m.call.transferee": boolean;
    "m.call.dtmf": boolean;
  }
  export interface CallReplacesTarget {
    id: string;
    display_name: string;
    avatar_url: string;
  }
  export type MCallBase = {
    call_id: string;
    version: string | number;
    seq: number;
  };
  export type MGroupCallBase = MCallBase & {
    conf_id: string;
    device_id: string;
    sender_session_id: string;
    dest_session_id: string;
    party_id: string;
  };
  export type MCallAnswer<Base extends MCallBase> = Base & {
    answer: SessionDescription;
    capabilities?: CallCapabilities;
    [SDPStreamMetadataKey]: SDPStreamMetadata;
  };
  export type MCallSelectAnswer<Base extends MCallBase> = Base & {
    selected_party_id: string;
  };
  export type MCallInvite<Base extends MCallBase> = Base & {
    offer: SessionDescription;
    lifetime: number;
    [SDPStreamMetadataKey]: SDPStreamMetadata;
  };
  export type MCallSDPStreamMetadataChanged<Base extends MCallBase> = Base & {
    [SDPStreamMetadataKey]: SDPStreamMetadata;
  };
  export type MCallReplacesEvent<Base extends MCallBase> = Base & {
    replacement_id: string;
    target_user: CallReplacesTarget;
    create_call: string;
    await_call: string;
    target_room: string;
  };
  export type MCAllAssertedIdentity<Base extends MCallBase> = Base & {
    asserted_identity: {
      id: string;
      display_name: string;
      avatar_url: string;
    };
  };
  export type MCallCandidates<Base extends MCallBase> = Base & {
    candidates: RTCIceCandidate[];
  };
  export type MCallHangupReject<Base extends MCallBase> = Base & {
    reason?: CallErrorCode;
  };
  export enum CallErrorCode {
    /** The user chose to end the call */
    UserHangup = "user_hangup",
    /** An error code when the local client failed to create an offer. */
    LocalOfferFailed = "local_offer_failed",
    /**
     * An error code when there is no local mic/camera to use. This may be because
     * the hardware isn't plugged in, or the user has explicitly denied access.
     */
    NoUserMedia = "no_user_media",
    /**
     * Error code used when a call event failed to send
     * because unknown devices were present in the room
     */
    UnknownDevices = "unknown_devices",
    /**
     * Error code used when we fail to send the invite
     * for some reason other than there being unknown devices
     */
    SendInvite = "send_invite",
    /**
     * An answer could not be created
     */
    CreateAnswer = "create_answer",
    /**
     * Error code used when we fail to send the answer
     * for some reason other than there being unknown devices
     */
    SendAnswer = "send_answer",
    /**
     * The session description from the other side could not be set
     */
    SetRemoteDescription = "set_remote_description",
    /**
     * The session description from this side could not be set
     */
    SetLocalDescription = "set_local_description",
    /**
     * A different device answered the call
     */
    AnsweredElsewhere = "answered_elsewhere",
    /**
     * No media connection could be established to the other party
     */
    IceFailed = "ice_failed",
    /**
     * The invite timed out whilst waiting for an answer
     */
    InviteTimeout = "invite_timeout",
    /**
     * The call was replaced by another call
     */
    Replaced = "replaced",
    /**
     * Signalling for the call could not be sent (other than the initial invite)
     */
    SignallingFailed = "signalling_timeout",
    /**
     * The remote party is busy
     */
    UserBusy = "user_busy",
    /**
     * We transferred the call off to somewhere else
     */
    Transfered = "transferred",
    /**
     * A call from the same user was found with a new session id
     */
    NewSession = "new_session",
  }
  export type SignallingMessage<Base extends MCallBase> =
    | {
        type: EventType.Invite;
        content: MCallInvite<Base>;
      }
    | {
        type: EventType.Answer;
        content: MCallAnswer<Base>;
      }
    | {
        type: EventType.SDPStreamMetadataChanged | EventType.SDPStreamMetadataChangedPrefix;
        content: MCallSDPStreamMetadataChanged<Base>;
      }
    | {
        type: EventType.Candidates;
        content: MCallCandidates<Base>;
      }
    | {
        type: EventType.Hangup | EventType.Reject;
        content: MCallHangupReject<Base>;
      };
  export enum CallIntent {
    Ring = "m.ring",
    Prompt = "m.prompt",
    Room = "m.room",
  }

  export type MemberOptions = Omit<PeerCallOptions, "emitUpdate" | "sendSignallingMessage"> & {
    confId: string;
    ownUserId: string;
    ownDeviceId: string;
    sessionId: string;
    hsApi: HomeServerApi;
    encryptDeviceMessage: (
      userId: string,
      message: SignallingMessage<MGroupCallBase>,
      log: ILogItem
    ) => Promise<EncryptedMessage>;
    emitUpdate: (participant: Member, params?: any) => void;
  };
  export class Member {
    readonly member: RoomMember;
    private callDeviceMembership;
    private readonly options;
    private readonly logItem;
    private peerCall?;
    private localMedia?;
    private retryCount;
    constructor(
      member: RoomMember,
      callDeviceMembership: CallDeviceMembership,
      options: MemberOptions,
      logItem: ILogItem
    );
    get remoteMedia(): RemoteMedia | undefined;
    get isConnected(): boolean;
    get userId(): string;
    get deviceId(): string;
    get deviceIndex(): number;
    get eventTimestamp(): number;
    get dataChannel(): any | undefined;
    /** @internal */
    connect(localMedia: LocalMedia): void;
    /** @internal */
    disconnect(hangup: boolean): void;
    /** @internal */
    updateCallInfo(callDeviceMembership: CallDeviceMembership): void;
    /** @internal */
    emitUpdate: (peerCall: PeerCall, params: any) => void;
    /** @internal */
    sendSignallingMessage: (message: SignallingMessage<MCallBase>, log: ILogItem) => Promise<void>;
    /** @internal */
    handleDeviceMessage(message: SignallingMessage<MGroupCallBase>, deviceId: string, syncLog: ILogItem): void;
    private _createPeerCall;
  }

  export class MuteSettings {
    public readonly microphone: boolean;
    public readonly camera: boolean;
    constructor(microphone: boolean, camera: boolean);
    toggleCamera(): MuteSettings;
    toggleMicrophone(): MuteSettings;
  }

  export enum GroupCallState {
    Fledgling = "fledgling",
    Creating = "creating",
    Created = "created",
    Joining = "joining",
    Joined = "joined",
  }
  export type GroupCallOptions = Omit<MemberOptions, "emitUpdate" | "confId" | "encryptDeviceMessage"> & {
    emitUpdate: (call: GroupCall, params?: any) => void;
    encryptDeviceMessage: (
      roomId: string,
      userId: string,
      message: SignallingMessage<MGroupCallBase>,
      log: ILogItem
    ) => Promise<EncryptedMessage>;
    storage: Storage;
  };
  export class GroupCall extends EventEmitter<{
    change: never;
  }> {
    readonly id: string;
    private callContent;
    readonly roomId: string;
    private readonly options;
    private readonly logItem;
    private readonly _members;
    private _localMedia?;
    private _memberOptions;
    private _state;
    constructor(
      id: string,
      newCall: boolean,
      callContent: Record<string, any>,
      roomId: string,
      options: GroupCallOptions,
      logItem: ILogItem
    );
    get localMedia(): LocalMedia | undefined;
    get members(): BaseObservableMap<string, Member>;
    get isTerminated(): boolean;
    get isRinging(): boolean;
    get name(): string;
    get intent(): CallIntent;
    get deviceIndex(): number | undefined;
    get eventTimestamp(): number | undefined;
    join(localMedia: LocalMedia): Promise<void>;
    setMedia(localMedia: LocalMedia): Promise<void>;
    setMuted(muteSettings: MuteSettings): Promise<void>;
    get muteSettings(): MuteSettings | undefined;
    get hasJoined(): boolean;
    leave(): Promise<void>;
    terminate(): Promise<void>;
    /** @internal */
    create(localMedia: LocalMedia): Promise<void>;
    /** @internal */
    updateCallEvent(callContent: Record<string, any>, syncLog: ILogItem): void;
    /** @internal */
    updateMembership(userId: string, callMembership: CallMembership, syncLog: ILogItem): void;
    /** @internal */
    removeMembership(userId: string, syncLog: ILogItem): void;
    private getDeviceIdsForUserId;
    private isMember;
    private removeOwnDevice;
    /** @internal */
    private removeMemberDevice;
    /** @internal */
    handleDeviceMessage(
      message: SignallingMessage<MGroupCallBase>,
      userId: string,
      deviceId: string,
      syncLog: ILogItem
    ): void;
    /** @internal */
    dispose(): void;
    private _createJoinPayload;
    private _leaveCallMemberContent;
    protected emitChange(): void;
  }

  export type CallHandlerOptions = Omit<GroupCallOptions, "emitUpdate" | "createTimeout"> & {
    logger: ILogger;
    clock: Clock;
  };

  type MemberChange = any;
  export type Content = { [key: string]: any };
  export interface TimelineEvent {
    content: Content;
    type: string;
    event_id: string;
    sender: string;
    origin_server_ts: number;
    unsigned?: Content;
  }
  export type StateEvent = TimelineEvent & { prev_content?: Content; state_key: string };
  export interface RoomStateEntry {
    roomId: string;
    event: StateEvent;
    key: string;
  }

  export class CallHandler {
    private readonly options;
    private readonly _calls;
    private memberToCallIds;
    private groupCallOptions;
    private sessionId;
    constructor(options: CallHandlerOptions);
    loadCalls(intent?: CallIntent): Promise<void>;
    loadCallsForRoom(intent: CallIntent, roomId: string): Promise<void>;
    private _getLoadTxn;
    private _loadCallEntries;
    createCall(roomId: string, callType: string, name: string, intent?: CallIntent): Promise<GroupCall>;
    get calls(): BaseObservableMap<string, GroupCall>;
    /** @internal */
    handleRoomState(room: Room, events: StateEvent[], txn: Transaction, log: ILogItem): void;
    /** @internal */
    updateRoomMembers(room: Room, memberChanges: Map<string, MemberChange>): void;
    /** @internal */
    handlesDeviceMessageEventType(eventType: string): boolean;
    /** @internal */
    handleDeviceMessage(
      message: SignallingMessage<MGroupCallBase>,
      userId: string,
      deviceId: string,
      log: ILogItem
    ): void;
    private handleCallEvent;
    private handleCallMemberEvent;
  }

  export interface MediaDevices {
    // filter out audiooutput
    enumerate(): Promise<MediaDeviceInfo[]>;
    // to assign to a video element, we downcast to WrappedTrack and use the stream property.
    getMediaTracks(audio: true | MediaDeviceInfo, video: boolean | MediaDeviceInfo): Promise<Stream>;
    getScreenShareTrack(): Promise<Stream | undefined>;
  }

  type HomeServerApiOptions = {
    homeserver: string;
    accessToken: string;
    request: RequestFunction;
    reconnector: Reconnector;
  };
  type BaseRequestOptions = {
    log?: ILogItem;
    allowedStatusCodes?: number[];
    uploadProgress?: (loadedBytes: number) => void;
    timeout?: number;
    prefix?: string;
  };
  export class HomeServerApi {
    private readonly _homeserver;
    private readonly _accessToken;
    private readonly _requestFn;
    private readonly _reconnector;
    constructor({ homeserver, accessToken, request, reconnector }: HomeServerApiOptions);
    private _url;
    private _baseRequest;
    private _unauthedRequest;
    private _authedRequest;
    private _post;
    private _put;
    private _get;
    sync(since: string, filter: string, timeout: number, options?: BaseRequestOptions): IHomeServerRequest;
    context(roomId: string, eventId: string, limit: number, filter: string): IHomeServerRequest;
    messages(roomId: string, params: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    members(roomId: string, params: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    send(
      roomId: string,
      eventType: string,
      txnId: string,
      content: Record<string, any>,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    event(roomId: string, eventId: string, options?: BaseRequestOptions): IHomeServerRequest;
    redact(
      roomId: string,
      eventId: string,
      txnId: string,
      content: Record<string, any>,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    receipt(roomId: string, receiptType: string, eventId: string, options?: BaseRequestOptions): IHomeServerRequest;
    state(roomId: string, eventType: string, stateKey: string, options?: BaseRequestOptions): IHomeServerRequest;
    sendState(
      roomId: string,
      eventType: string,
      stateKey: string,
      content: Record<string, any>,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    getLoginFlows(): IHomeServerRequest;
    register(
      username: string | null,
      password: string,
      initialDeviceDisplayName: string,
      auth?: Record<string, any>,
      inhibitLogin?: boolean,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    passwordLogin(
      username: string,
      password: string,
      initialDeviceDisplayName: string,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    tokenLogin(
      loginToken: string,
      txnId: string,
      initialDeviceDisplayName: string,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    createFilter(userId: string, filter: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    versions(options?: BaseRequestOptions): IHomeServerRequest;
    uploadKeys(
      dehydratedDeviceId: string,
      payload: Record<string, any>,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    queryKeys(queryRequest: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    claimKeys(payload: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    sendToDevice(
      type: string,
      payload: Record<string, any>,
      txnId: string,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    roomKeysVersion(version?: string, options?: BaseRequestOptions): IHomeServerRequest;
    roomKeyForRoomAndSession(
      version: string,
      roomId: string,
      sessionId: string,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    uploadRoomKeysToBackup(
      version: string,
      payload: Record<string, any>,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
    uploadAttachment(blob: IBlobHandle, filename: string, options?: BaseRequestOptions): IHomeServerRequest;
    setPusher(pusher: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    getPushers(options?: BaseRequestOptions): IHomeServerRequest;
    join(roomId: string, options?: BaseRequestOptions): IHomeServerRequest;
    joinIdOrAlias(roomIdOrAlias: string, options?: BaseRequestOptions): IHomeServerRequest;
    invite(roomId: string, userId: string, options?: BaseRequestOptions): IHomeServerRequest;
    leave(roomId: string, options?: BaseRequestOptions): IHomeServerRequest;
    forget(roomId: string, options?: BaseRequestOptions): IHomeServerRequest;
    kick(roomId: string, userId: string, reason?: string, options?: BaseRequestOptions): IHomeServerRequest;
    ban(roomId: string, userId: string, reason?: string, options?: BaseRequestOptions): IHomeServerRequest;
    unban(roomId: string, userId: string, reason?: string, options?: BaseRequestOptions): IHomeServerRequest;
    logout(options?: BaseRequestOptions): IHomeServerRequest;
    getDehydratedDevice(options?: BaseRequestOptions): IHomeServerRequest;
    createDehydratedDevice(payload: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    claimDehydratedDevice(deviceId: string, options?: BaseRequestOptions): IHomeServerRequest;
    searchProfile(searchTerm: string, limit?: number, options?: BaseRequestOptions): IHomeServerRequest;
    profile(userId: string, options?: BaseRequestOptions): IHomeServerRequest;
    setProfileDisplayName(userId: string, displayName: string, options?: BaseRequestOptions): IHomeServerRequest;
    setProfileAvatarUrl(userId: string, avatarUrl: string, options?: BaseRequestOptions): IHomeServerRequest;
    createRoom(payload: Record<string, any>, options?: BaseRequestOptions): IHomeServerRequest;
    setAccountData(
      ownUserId: string,
      type: string,
      content: Record<string, any>,
      options?: BaseRequestOptions
    ): IHomeServerRequest;
  }

  export interface IHomeServerRequest {
    abort(): void;
    response(): Promise<any>;
    responseCode(): Promise<number>;
  }
  type HomeServerRequestOptions = {
    log?: ILogItem;
    allowedStatusCodes?: number[];
  };
  export class HomeServerRequest implements IHomeServerRequest {
    private readonly _log?;
    private _sourceRequest?;
    private readonly _promise;
    constructor(method: string, url: string, sourceRequest: RequestResult, options?: HomeServerRequestOptions);
    abort(): void;
    response(): Promise<any>;
    responseCode(): Promise<number>;
  }

  enum ConnectionStatus {
    "Waiting" = 0,
    "Reconnecting" = 1,
    "Online" = 2,
  }
  type Ctor = {
    retryDelay: ExponentialRetryDelay;
    createMeasure: () => TimeMeasure;
    onlineStatus: any;
  };

  export type Attachment = {
    body: string;
    info: AttachmentInfo;
    msgtype: string;
    url?: string;
    file?: EncryptedFile;
    filename?: string;
  };
  export type EncryptedFile = {
    key: JsonWebKey;
    iv: string;
    hashes: {
      sha256: string;
    };
    url: string;
    v: string;
    mimetype?: string;
  };
  type AttachmentInfo = {
    h?: number;
    w?: number;
    mimetype: string;
    size: number;
    duration?: number;
    thumbnail_url?: string;
    thumbnail_file?: EncryptedFile;
    thumbnail_info?: ThumbnailInfo;
  };
  type ThumbnailInfo = {
    h: number;
    w: number;
    mimetype: string;
    size: number;
  };
  export type VersionResponse = {
    versions: string[];
    unstable_features?: Record<string, boolean>;
  };

  export class Reconnector {
    private readonly _retryDelay;
    private readonly _createTimeMeasure;
    private readonly _onlineStatus;
    private readonly _state;
    private _isReconnecting;
    private _versionsResponse?;
    private _stateSince;
    constructor({ retryDelay, createMeasure, onlineStatus }: Ctor);
    get lastVersionsResponse(): VersionResponse | undefined;
    get connectionStatus(): ObservableValue<ConnectionStatus>;
    get retryIn(): number;
    onRequestFailed(hsApi: HomeServerApi): Promise<void>;
    tryNow(): void;
    private _setState;
    private _reconnectLoop;
  }
  export class ExponentialRetryDelay {
    private readonly _start;
    private _current;
    private readonly _createTimeout;
    private readonly _max;
    private _timeout?;
    constructor(createTimeout: (ms: number) => Timeout);
    waitForRetry(): Promise<void>;
    abort(): void;
    reset(): void;
    get nextValue(): number;
  }
  export type IDBKey = IDBValidKey | IDBKeyRange;
  export class Transaction {
    private _txn;
    private _allowedStoreNames;
    private _stores;
    private _storage;
    private _writeErrors;
    constructor(txn: IDBTransaction, allowedStoreNames: StoreNames[], storage: Storage);
    get idbFactory(): IDBFactory;
    get IDBKeyRange(): typeof IDBKeyRange;
    get databaseName(): string;
    get logger(): ILogger;
    _idbStore(name: StoreNames): Store<any>;
    _store<T>(name: StoreNames, mapStore: (idbStore: Store<any>) => T): T;
    get session(): SessionStore;
    get roomSummary(): RoomSummaryStore;
    get archivedRoomSummary(): RoomSummaryStore;
    get invites(): InviteStore;
    get timelineFragments(): any;
    get timelineEvents(): any;
    get timelineRelations(): any;
    get roomState(): any;
    get roomMembers(): RoomMemberStore;
    get pendingEvents(): any;
    get userIdentities(): any;
    get deviceIdentities(): any;
    get olmSessions(): any;
    get inboundGroupSessions(): any;
    get outboundGroupSessions(): any;
    get groupSessionDecryptions(): any;
    get operations(): any;
    get accountData(): any;
    get calls(): CallStore;
    complete(log?: ILogItem): Promise<void>;
    getCause(error: Error): Error;
    abort(log?: ILogItem): void;
    addWriteError(
      error: StorageError,
      refItem: ILogItem | undefined,
      operationName: string,
      keys: IDBKey[] | undefined
    ): void;
    private _logWriteErrors;
  }

  export enum StoreNames {
    session = "session",
    roomState = "roomState",
    roomSummary = "roomSummary",
    archivedRoomSummary = "archivedRoomSummary",
    invites = "invites",
    roomMembers = "roomMembers",
    timelineEvents = "timelineEvents",
    timelineRelations = "timelineRelations",
    timelineFragments = "timelineFragments",
    pendingEvents = "pendingEvents",
    userIdentities = "userIdentities",
    deviceIdentities = "deviceIdentities",
    olmSessions = "olmSessions",
    inboundGroupSessions = "inboundGroupSessions",
    outboundGroupSessions = "outboundGroupSessions",
    groupSessionDecryptions = "groupSessionDecryptions",
    operations = "operations",
    accountData = "accountData",
    calls = "calls",
  }
  export const STORE_NAMES: Readonly<StoreNames[]>;
  export class StorageError extends Error {
    errcode?: string;
    cause?: Error;
    constructor(message: string, cause?: Error);
    get name(): string;
  }
  export const KeyLimits: {
    readonly minStorageKey: number;
    readonly middleStorageKey: number;
    readonly maxStorageKey: number;
  };
  export interface CallEntry {
    intent: string;
    roomId: string;
    callId: string;
    timestamp: number;
  }
  type CallStorageEntry = {
    key: string;
    timestamp: number;
  };
  export class CallStore {
    private _callStore;
    constructor(idbStore: Store<CallStorageEntry>);
    getByIntent(intent: string): Promise<CallEntry[]>;
    getByIntentAndRoom(intent: string, roomId: string): Promise<CallEntry[]>;
    add(entry: CallEntry): void;
    remove(intent: string, roomId: string, callId: string): void;
  }

  export class QueryTargetWrapper<T> {
    private _qt;
    constructor(qt: IDBIndex | IDBObjectStore);
    get keyPath(): string | string[];
    get _qtStore(): IDBObjectStore;
    supports(methodName: string): boolean;
    openKeyCursor(range?: IDBQuery, direction?: IDBCursorDirection | undefined): IDBRequest<IDBCursor | null>;
    openCursor(range?: IDBQuery, direction?: IDBCursorDirection | undefined): IDBRequest<IDBCursorWithValue | null>;
    put(item: T, key?: IDBValidKey | undefined): IDBRequest<IDBValidKey>;
    add(item: T, key?: IDBValidKey | undefined): IDBRequest<IDBValidKey>;
    get(key: IDBValidKey | IDBKeyRange): IDBRequest<T | undefined>;
    getKey(key: IDBValidKey | IDBKeyRange): IDBRequest<IDBValidKey | undefined>;
    delete(key: IDBValidKey | IDBKeyRange): IDBRequest<undefined>;
    count(keyRange?: IDBKeyRange): IDBRequest<number>;
    index(name: string): IDBIndex;
    get indexNames(): string[];
  }
  export class Store<T> extends QueryTarget<T> {
    constructor(idbStore: IDBObjectStore, transaction: ITransaction);
    get _idbStore(): QueryTargetWrapper<T>;
    index(indexName: string): QueryTarget<T>;
    put(value: T, log?: ILogItem): void;
    add(value: T, log?: ILogItem): void;
    tryAdd(value: T, log: ILogItem): Promise<boolean>;
    delete(keyOrKeyRange: IDBValidKey | IDBKeyRange, log?: ILogItem): void;
    private _prepareErrorLog;
    private _getKeys;
    private _readKeyPath;
  }
  export interface ITransaction {
    idbFactory: IDBFactory;
    IDBKeyRange: typeof IDBKeyRange;
    databaseName: string;
    addWriteError(
      error: StorageError,
      refItem: ILogItem | undefined,
      operationName: string,
      keys: IDBKey[] | undefined
    ): any;
  }
  type Reducer<A, B> = (acc: B, val: A) => B;
  export type IDBQuery = IDBValidKey | IDBKeyRange | undefined | null;
  interface QueryTargetInterface<T> {
    openCursor(range?: IDBQuery, direction?: IDBCursorDirection | undefined): IDBRequest<IDBCursorWithValue | null>;
    openKeyCursor(range?: IDBQuery, direction?: IDBCursorDirection | undefined): IDBRequest<IDBCursor | null>;
    supports(method: string): boolean;
    keyPath: string | string[];
    count(keyRange?: IDBKeyRange): IDBRequest<number>;
    get(key: IDBValidKey | IDBKeyRange): IDBRequest<T | undefined>;
    getKey(key: IDBValidKey | IDBKeyRange): IDBRequest<IDBValidKey | undefined>;
  }
  export class QueryTarget<T> {
    protected _target: QueryTargetInterface<T>;
    protected _transaction: ITransaction;
    constructor(target: QueryTargetInterface<T>, transaction: ITransaction);
    get idbFactory(): IDBFactory;
    get IDBKeyRange(): typeof IDBKeyRange;
    get databaseName(): string;
    _openCursor(range?: IDBQuery, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null>;
    supports(methodName: string): boolean;
    count(keyRange?: IDBKeyRange): Promise<number>;
    get(key: IDBValidKey | IDBKeyRange): Promise<T | undefined>;
    getKey(key: IDBValidKey | IDBKeyRange): Promise<IDBValidKey | undefined>;
    reduce<B>(range: IDBQuery, reducer: Reducer<T, B>, initialValue: B): Promise<boolean>;
    reduceReverse<B>(range: IDBQuery, reducer: Reducer<T, B>, initialValue: B): Promise<boolean>;
    selectLimit(range: IDBQuery, amount: number): Promise<T[]>;
    selectLimitReverse(range: IDBQuery, amount: number): Promise<T[]>;
    selectWhile(range: IDBQuery, predicate: (v: T) => boolean): Promise<T[]>;
    selectWhileReverse(range: IDBQuery, predicate: (v: T) => boolean): Promise<T[]>;
    selectAll(range?: IDBQuery, direction?: IDBCursorDirection): Promise<T[]>;
    selectFirst(range: IDBQuery): Promise<T | undefined>;
    selectLast(range: IDBQuery): Promise<T | undefined>;
    find(range: IDBQuery, predicate: (v: T) => boolean): Promise<T | undefined>;
    findReverse(range: IDBQuery, predicate: (v: T) => boolean): Promise<T | undefined>;
    findMaxKey(range: IDBQuery): Promise<IDBValidKey | undefined>;
    iterateValues(
      range: IDBQuery,
      callback: (val: T, key: IDBValidKey, cur: IDBCursorWithValue) => boolean
    ): Promise<void>;
    iterateKeys(range: IDBQuery, callback: (key: IDBValidKey, cur: IDBCursor) => boolean): Promise<void>;
    /**
     * Checks if a given set of keys exist.
     * If the callback returns true, the search is halted and callback won't be called again.
     */
    findExistingKeys(
      keys: IDBValidKey[],
      backwards: boolean,
      callback: (key: IDBValidKey, pk: IDBValidKey) => boolean
    ): Promise<void>;
    _reduce<B>(
      range: IDBQuery,
      reducer: (reduced: B, value: T) => B,
      initialValue: B,
      direction: IDBCursorDirection
    ): Promise<boolean>;
    _selectLimit(range: IDBQuery, amount: number, direction: IDBCursorDirection): Promise<T[]>;
    _selectUntil(range: IDBQuery, predicate: (vs: T[], v: T) => boolean, direction: IDBCursorDirection): Promise<T[]>;
    _selectWhile(range: IDBQuery, predicate: (v: T) => boolean, direction: IDBCursorDirection): Promise<T[]>;
    iterateWhile(range: IDBQuery, predicate: (v: T) => boolean): Promise<void>;
    _find(range: IDBQuery, predicate: (v: T) => boolean, direction: IDBCursorDirection): Promise<T | undefined>;
  }
  export interface SessionEntry {
    key: string;
    value: any;
  }
  export class SessionStore {
    private _sessionStore;
    private _localStorage;
    constructor(sessionStore: Store<SessionEntry>, localStorage: IDOMStorage);
    private get _localStorageKeyPrefix();
    get(key: string): Promise<any>;
    _writeKeyToLocalStorage(key: string, value: any): void;
    writeE2EEIdentityToLocalStorage(): void;
    tryRestoreE2EEIdentityFromLocalStorage(log: ILogItem): Promise<boolean>;
    set(key: string, value: any): void;
    add(key: string, value: any): void;
    remove(key: string): void;
  }
  export interface IDOMStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    key(n: number): string | null;
    readonly length: number;
  }

  type SummaryData = any;

  export class RoomSummaryStore {
    private _summaryStore;
    constructor(summaryStore: Store<SummaryData>);
    getAll(): Promise<SummaryData[]>;
    set(summary: SummaryData): void;
    get(roomId: string): Promise<SummaryData | null>;
    has(roomId: string): Promise<boolean>;
    remove(roomId: string): void;
  }

  type ClaimedOTKResponse = {
    [userId: string]: {
      [deviceId: string]: {
        [algorithmAndOtk: string]: {
          key: string;
          signatures: {
            [userId: string]: {
              [algorithmAndDevice: string]: string;
            };
          };
        };
      };
    };
  };

  type Account = any;

  export class Encryption {
    private readonly account;
    private readonly pickleKey;
    private readonly olm;
    private readonly storage;
    private readonly now;
    private readonly ownUserId;
    private readonly olmUtil;
    private readonly senderKeyLock;
    constructor(
      account: Account,
      pickleKey: string,
      olm: typeof Olm,
      storage: Storage,
      now: () => number,
      ownUserId: string,
      olmUtil: Olm.Utility,
      senderKeyLock: any
    );
    encrypt(
      type: string,
      content: Record<string, any>,
      devices: DeviceIdentity[],
      hsApi: HomeServerApi,
      log: ILogItem
    ): Promise<EncryptedMessage[]>;
    _encryptForMaxDevices(
      type: string,
      content: Record<string, any>,
      devices: DeviceIdentity[],
      hsApi: HomeServerApi,
      log: ILogItem
    ): Promise<EncryptedMessage[]>;
    _findExistingSessions(devices: DeviceIdentity[]): Promise<{
      devicesWithoutSession: DeviceIdentity[];
      existingEncryptionTargets: EncryptionTarget[];
    }>;
    _encryptForDevice(type: string, content: Record<string, any>, target: EncryptionTarget): OlmEncryptedMessageContent;
    _buildPlainTextMessageForDevice(type: string, content: Record<string, any>, device: DeviceIdentity): OlmPayload;
    _createNewSessions(
      devicesWithoutSession: DeviceIdentity[],
      hsApi: HomeServerApi,
      timestamp: number,
      log: ILogItem
    ): Promise<EncryptionTarget[]>;
    _claimOneTimeKeys(
      hsApi: HomeServerApi,
      deviceIdentities: DeviceIdentity[],
      log: ILogItem
    ): Promise<EncryptionTarget[]>;
    _verifyAndCreateOTKTargets(
      userKeyMap: ClaimedOTKResponse,
      devicesByUser: Map<string, Map<string, DeviceIdentity>>,
      log: ILogItem
    ): EncryptionTarget[];
    _loadSessions(encryptionTargets: EncryptionTarget[]): Promise<void>;
    _storeSessions(encryptionTargets: EncryptionTarget[], timestamp: number): Promise<void>;
  }
  class EncryptionTarget {
    readonly device: DeviceIdentity;
    readonly oneTimeKey: string | null;
    readonly sessionId: string | null;
    session: Olm.Session | null;
    constructor(device: DeviceIdentity, oneTimeKey: string | null, sessionId: string | null);
    static fromOTK(device: DeviceIdentity, oneTimeKey: string): EncryptionTarget;
    static fromSessionId(device: DeviceIdentity, sessionId: string): EncryptionTarget;
    dispose(): void;
  }
  export class EncryptedMessage {
    readonly content: OlmEncryptedMessageContent;
    readonly device: DeviceIdentity;
    constructor(content: OlmEncryptedMessageContent, device: DeviceIdentity);
  }

  export interface DeviceIdentity {
    userId: string;
    deviceId: string;
    ed25519Key: string;
    curve25519Key: string;
    algorithms: string[];
    displayName: string;
    key: string;
  }
  export class DeviceIdentityStore {
    private _store;
    constructor(store: Store<DeviceIdentity>);
    getAllForUserId(userId: string): Promise<DeviceIdentity[]>;
    getAllDeviceIds(userId: string): Promise<string[]>;
    get(userId: string, deviceId: string): Promise<DeviceIdentity | undefined>;
    set(deviceIdentity: DeviceIdentity): void;
    getByCurve25519Key(curve25519Key: string): Promise<DeviceIdentity | undefined>;
    remove(userId: string, deviceId: string): void;
    removeAllForUser(userId: string): void;
  }

  export const enum OlmPayloadType {
    PreKey = 0,
    Normal = 1,
  }
  export type OlmMessage = {
    type?: OlmPayloadType;
    body?: string;
  };
  export type OlmEncryptedMessageContent = {
    algorithm?: "m.olm.v1.curve25519-aes-sha2";
    sender_key?: string;
    ciphertext?: {
      [deviceCurve25519Key: string]: OlmMessage;
    };
  };
  export type OlmEncryptedEvent = {
    type?: "m.room.encrypted";
    content?: OlmEncryptedMessageContent;
    sender?: string;
  };
  export type OlmPayload = {
    type?: string;
    content?: Record<string, any>;
    sender?: string;
    recipient?: string;
    recipient_keys?: {
      ed25519?: string;
    };
    keys?: {
      ed25519?: string;
    };
  };

  export interface InviteData {
    roomId: string;
    isEncrypted: boolean;
    isDirectMessage: boolean;
    name?: string;
    avatarUrl?: string;
    avatarColorId: number;
    canonicalAlias?: string;
    timestamp: number;
    joinRule: string;
    inviter?: MemberData;
  }
  export class InviteStore {
    private _inviteStore;
    constructor(inviteStore: Store<InviteData>);
    getAll(): Promise<InviteData[]>;
    set(invite: InviteData): void;
    remove(roomId: string): void;
  }

  export interface MemberData {
    roomId: string;
    userId: string;
    avatarUrl: string;
    displayName: string;
    membership: "join" | "leave" | "invite" | "ban";
  }
  type MemberStorageEntry = MemberData & {
    key: string;
  };
  export class RoomMemberStore {
    private _roomMembersStore;
    constructor(roomMembersStore: Store<MemberStorageEntry>);
    get(roomId: string, userId: string): Promise<MemberStorageEntry | undefined>;
    set(member: MemberData): void;
    getAll(roomId: string): Promise<MemberData[]>;
    getAllUserIds(roomId: string): Promise<string[]>;
    removeAllForRoom(roomId: string): void;
  }

  export function makeTxnId(): string;
}
