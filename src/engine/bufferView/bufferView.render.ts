import { registerResourceLoader } from "../resource/resource.render";
import { createBufferViewModule } from "./bufferView.common";

export const BufferViewModule = createBufferViewModule(registerResourceLoader);
