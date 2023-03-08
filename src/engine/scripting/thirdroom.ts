import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { FREQ_BIN_COUNT } from "../audio/audio.common";
import { AudioModule } from "../audio/audio.game";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { EnableMatrixMaterialMessage, RendererMessageType, XRMode } from "../renderer/renderer.common";
import { getXRMode } from "../renderer/renderer.game";
import { WASMModuleContext, writeEncodedString, writeUint8Array } from "./WASMModuleContext";

export function createThirdroomModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  return {
    get_js_source_size() {
      return wasmCtx.encodedJSSource ? wasmCtx.encodedJSSource.byteLength + 1 : 0;
    },
    get_js_source(destPtr: number) {
      try {
        if (!wasmCtx.encodedJSSource) {
          console.error("Thirdroom: No JS source set.");
          return -1;
        }

        return writeEncodedString(wasmCtx, destPtr, wasmCtx.encodedJSSource);
      } catch (error) {
        console.error("Thirdroom: Error getting JS source:", error);
        return -1;
      }
    },
    enable_matrix_material(enabled: number) {
      ctx.sendMessage<EnableMatrixMaterialMessage>(Thread.Render, {
        type: RendererMessageType.EnableMatrixMaterial,
        enabled: !!enabled,
      });
    },
    get_audio_data_size() {
      return FREQ_BIN_COUNT;
    },
    get_audio_frequency_data(audioDataPtr: number) {
      const audio = getModule(ctx, AudioModule);
      const { frequencyData } = getReadObjectBufferView(audio.analyserTripleBuffer);
      return writeUint8Array(wasmCtx, audioDataPtr, frequencyData);
    },
    get_audio_time_data(audioDataPtr: number) {
      const audio = getModule(ctx, AudioModule);
      const { timeData } = getReadObjectBufferView(audio.analyserTripleBuffer);
      return writeUint8Array(wasmCtx, audioDataPtr, timeData);
    },
    in_ar() {
      const ourXRMode = getXRMode(ctx);
      const sceneSupportsAR = ctx.worldResource.environment?.publicScene.supportsAR || false;
      return ourXRMode === XRMode.ImmersiveAR && sceneSupportsAR ? 1 : 0;
    },
  };
}
