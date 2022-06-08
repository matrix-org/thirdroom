import { BaseThreadContext, defineModule } from "../module/module.common";
import { RegisterResourceLoaderFunction, ResourceId } from "../resource/resource.common";

export const BufferViewResourceType = "buffer-view";

export interface BufferViewResourceProps {
  buffer: ArrayBuffer | SharedArrayBuffer;
  byteStride: number;
}

type BufferViewModuleState = {};

export interface LocalBufferView {
  buffer: ArrayBuffer | SharedArrayBuffer;
  byteStride: number;
}

export const createBufferViewModule = <ThreadContext extends BaseThreadContext>(
  registerResourceLoader: RegisterResourceLoaderFunction<ThreadContext>
) => {
  const BufferViewModule = defineModule<ThreadContext, BufferViewModuleState>({
    name: "buffer-view",
    create() {
      return {};
    },
    init(ctx) {
      const disposables = [registerResourceLoader(ctx, BufferViewResourceType, onLoadBufferView)];

      return () => {
        for (const dispose of disposables) {
          dispose();
        }
      };
    },
  });

  async function onLoadBufferView(
    ctx: ThreadContext,
    id: ResourceId,
    props: BufferViewResourceProps
  ): Promise<LocalBufferView> {
    return { ...props };
  }

  return BufferViewModule;
};
