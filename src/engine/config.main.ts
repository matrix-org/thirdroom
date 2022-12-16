import { defineConfig } from "./module/module.common";
import { AudioModule, MainThreadAudioSystem } from "./audio/audio.main";
import { EditorModule, MainThreadEditorSystem } from "./editor/editor.main";
import { InputModule } from "./input/input.main";
import { MainThreadNetworkSystem, NetworkModule } from "./network/network.main";
import { StatsModule } from "./stats/stats.main";
import { IMainThreadContext } from "./MainThread";
import { RendererModule } from "./renderer/renderer.main";
import { ResourceModule, ResourceDisposalSystem } from "./resource/resource.main";
import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.main";

export default defineConfig<IMainThreadContext>({
  modules: [
    ResourceModule,
    EditorModule,
    AudioModule,
    NetworkModule,
    InputModule,
    StatsModule,
    RendererModule,
    ThirdroomModule,
  ],
  systems: [MainThreadAudioSystem, MainThreadNetworkSystem, MainThreadEditorSystem, ResourceDisposalSystem],
});
