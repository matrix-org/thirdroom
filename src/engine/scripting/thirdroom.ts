import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { FREQ_BIN_COUNT } from "../audio/audio.common";
import { AudioModule } from "../audio/audio.game";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { EnableMatrixMaterialMessage, RendererMessageType } from "../renderer/renderer.common";
import { WASMModuleContext } from "./WASMModuleContext";

export function createThirdroomModule(ctx: GameState, { U8Heap, textEncoder, encodedJSSource }: WASMModuleContext) {
  return {
    get_js_source_size() {
      return encodedJSSource ? encodedJSSource.byteLength : 0;
    },
    get_js_source(destPtr: number) {
      if (!encodedJSSource) {
        return -1;
      }

      try {
        U8Heap.set(encodedJSSource, destPtr);
      } catch (error) {
        console.error("Error getting JS source:", error);
        return -1;
      }

      return encodedJSSource.byteLength;
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
      const audioAnalyser = getReadObjectBufferView(audio.analyserTripleBuffer);
      U8Heap.set(audioAnalyser.frequencyData, audioDataPtr);
    },
    get_audio_time_data(audioDataPtr: number) {
      const audio = getModule(ctx, AudioModule);
      const audioAnalyser = getReadObjectBufferView(audio.analyserTripleBuffer);
      U8Heap.set(audioAnalyser.timeData, audioDataPtr);
    },
  };
}
