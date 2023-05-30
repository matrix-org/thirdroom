# Third Room for Creators

![Screenshot of the ThirdRoom Unity Exporter](/images/UnityExporter.jpg)

This guide is designed to help you understand how to create, export, and upload your 3D content for use in Third Room worlds. With Third Room, you have the opportunity to bring your artistic vision to life in a virtual environment that promotes collaboration and communication.

## Creating 3D Content

Third Room supports the [glTF](https://www.khronos.org/gltf/) format for 3D content. This format is an open standard for transmitting 3D models and scenes. It is designed to be compact, efficient, and compatible with a wide variety of software and platforms.

Currently we recommend using our official [Unity exporter](/guides/unity/) for creating environments. This exporter allows you to bake lightmaps, set spawn points, add physics to objects, and much more. You can also use and other 3D modeling software and import that content into Unity to then add the Third Room components like physics and spawn points.

We're actively working on an in-engine editor that will allow you to create worlds directly in Third Room. You can it out at any time by pressing the `` ` `` key in any Third Room world you've created. Once the editor is finished, you'll be able to easily import your 3D content directly from any 3D modeling software that supports glTF without going through Unity.

## Optimizing Your 3D Content

Third Room worlds are designed to be lightweight, efficient, and work across a wide variety of devices. To ensure that your worlds load quickly and run smoothly, we recommend following these guidelines when creating your 3D content:

- Minimize draw calls by combining objects into a single mesh or using instancing where possible
- Reuse materials and textures where possible
- Bake lightmaps into your scene to reduce the number of lights and shadows that need to be rendered in real time
- Compress your textures using the Third Room Asset Pipeline
- Keep your texture resolutions to 2k or less
- Reduce your poly count, this is less important thant the other two but it's still a good idea to keep your poly count below 100k in most cases

The Third Room Asset Pipeline can be found [here](https://thirdroom.io/pipeline). Just drag and drop your .gltf, .bin, .png, .jpg, .mp3, etc files into the window and it will resize and compress textures as well as de-duplicate resources for you.

## Uploading

To use your 3D creations in Third Room, you'll need to upload them to the platform. Follow these steps to upload your glTF files:

1. Log in to Third Room and click the plus (+) sign at the top of the left panel and click "Create World" or edit an existing world's settings.
1. Select and upload the scene, script, and thumbnail image for the world. Your scene should be a binary glTF file or (.glb) ideally less than 50mb in size. Your script can either be a Javascript file or .wasm file (see the [developer guide for more info](/guides/developers)). Your thumbnail should be a square image in .jpg or .png format.
1. Click the "Create World" button to finalize the process and make your world available to other Third Room users.
