import { registerResourceLoader } from "../resource/resource.main";
import { createBufferViewModule } from "./bufferView.common";

export const BufferViewModule = createBufferViewModule(registerResourceLoader);
