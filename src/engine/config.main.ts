import { defineConfig } from "./module/module.common";
import { AudioModule, MainThreadAudioSystem } from "./audio/audio.main";
import { EditorModule, MainThreadEditorSystem } from "./editor/editor.main";
import { InputModule, MainThreadInputSystem } from "./input/input.main";
import { NetworkModule } from "./network/network.main";
import { StatsModule } from "./stats/stats.main";
import { IMainThreadContext } from "./MainThread";
import { RendererModule } from "./renderer/renderer.main";

export default defineConfig<IMainThreadContext>({
  modules: [EditorModule, AudioModule, NetworkModule, InputModule, StatsModule, RendererModule],
  systems: [MainThreadAudioSystem, MainThreadEditorSystem, MainThreadInputSystem],
});
