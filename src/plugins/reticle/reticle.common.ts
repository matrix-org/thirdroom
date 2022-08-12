export const ReticleFocusMessage = "reticle-focus-message";

export interface ReticleFocusMessageType {
  type: typeof ReticleFocusMessage;
  focused: boolean;
  entityId?: number;
  networkId?: number;
  peerId?: string;
}
