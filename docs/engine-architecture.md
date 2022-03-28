# Engine Architecture

## Multi-threading

The Third Room Engine uses multiple threads via Web Workers to give ourselves more time to render a frame, update game state, and avoid blocking UI interactions.

We use two main synchronization primitives:
1. `postMessage` we send messages from one thread to another and either queue them up to be processed in the next frame, or we process them synchronously as they come in. We can also transfer buffers and other `Transferable` objects from one thread to another using this API.
2. `TripleBuffer` this data structure holds 3 `SharedArrayBuffer` objects and a set of flags which are read/modified via the `Atomics` APIs. These flags tell us which buffer should be used for writing, which one should be used for reading, and which one is ready to write to next. Our writer thread can swap back and forth between the current write buffer and the clean buffer. The reader thread then reads the read buffer and when it's done it swaps to the clean buffer. The read thread and write thread can run at independent rates too! Which is great, because then we can render at 144hz or whatever your fancy gaming monitor renders at and we can run the game thread at a fixed 60hz.

- Main Thread
  - UI (React)
    - DOM access is restricted to the main thread, so we render our 2D UI there.
  - Audio
    - Unfortunately, we can't load or play audio on other workers, so we handle loading and playing audio on the main thread.
  - WebRTC Networking
    - WebRTC is limited to the main thread and it's also where we want to play back audio, so it's handled there.
  - Matrix Client (Hydrogen)
    - Hydrogen *could* run on a worker, but we want to handle WebRTC on the main thread, so we run it there for now. We could possibly split VoIP from the rest of Hydrogen, but we'd need to see that Matrix overhead is enough that it deserves it's own thread.
- Render Thread
  - Requires OffscreenCanvas, which is currently only available on Blink based browsers (Chrome, Edge, Opera, etc.)
  - When OffscreenCanvas isn't available, the Render Thread is ran on the Main Thread.
  - Runs the Three.js WebGLRenderer
    - Runs at your your native refresh rate
    - Interpolates between the current state and the game thread state when rendering objects
    - Reads renderable object state stored in the TripleBuffer
  - Handles resource loading
    - We really could load resources on other threads, but the output of loaders like GLTFLoader are Three.js objects so, for now, we load resources on the render thread.
    - As we build up the resource loaders, we may decide to move resource loading to the GameThread so that when you load a glTF we can create entities for all the nodes and load remote resources for meshes, materials, geometries, cameras, etc.
    - Right now you trigger loading resources from the Game Thread via a `postMessage` when then creates the resource directly like a `Mesh` constructor, or via a loader like `GLTFLoader`. The Render Thread can create sub-resources in response to loading a resource and it communicates these sub-resources back to the Game Thread where it can create entities with these resources.
- Game Thread
  - Runs the physics simulation
  - Handles all the gameplay logic
  - Writes renderable state to the TripleBuffer

As we build out our User Generated Content (UGC) system, we can also probably split out UGC scripts each onto their own thread or maintain a worker pool for running these scripts. They can be ran in parallel because they work on sub-scene graphs and don't have data dependencies.

## Resource Management

The engine's resource manager allows us to work with resources locked to certain threads from the game thread. So if we want to create a mesh on the game thread, we use a resource loader to create that mesh object on the game thread on the next frame. When loading a resource, we get the resource id synchronously and we can reference that resource id in components or when loading other resources.

Some resources will be created on the next frame and others will be loaded over multiple frames. You can wait for a resource to be loaded before adding it to a component by watching the resource's state until it switches to loaded or you can add it to a component immediately and it will be rendered when it is loaded.

Some loaders, such as the GLTFLoader create subresources. Those subresources are created on the render thread and then reported in the loader's response, sent back to the game thread via `postMessage`.

The Resource Manager uses reference counting to determine if we should keep it around or unload it to save memory. So when we add a resource to a component, we should increase the reference count. Subresources use the reference counter of their root resource. This means if any subresource is referenced, the whole resource is kept around. Only when the root resource counter goes to zero will the subresource be disposed.

We could manage this a bit better by maintaining a dependency graph and disposing of subresources that aren't being used. However, in practice, if a subresource is being used, we're likely using most of the root resource. So disposing of the pieces we aren't using wouldn't save us much memory and would be a lot more complex.

Almost all of our resources can be created on a Web Worker thread, so we create most resources on the Render Thread where they are being used. However, we can't load or use audio in a worker. So instead we load audio on the main thread.

