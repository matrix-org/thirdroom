import { AudioModule } from "./audio/audio.main";
import { EditorModule } from "./editor/editor.main";
import { InputModule } from "./input/input.main";
import { NetworkModule } from "./network/network.main";
import { StatsModule } from "./stats/stats.main";

export const modules = [EditorModule, AudioModule, NetworkModule, InputModule, StatsModule];
