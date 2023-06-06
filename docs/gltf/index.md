# glTF Extensions Overview

Below is a list of the currently supported glTF extensions in Third Room and their specifications. Third Room is focused on trying to push forward standards for 3D content in the hopes of promoting interoperability. This means our content should work anywhere where these extensions are supported and anyone wanting to support Third Room's content can do so by implementing the extensions below. It also means any tool wishing to export to Third Room (Blender, Unity, Godot, etc.) should implement the following extensions. If you are looking to add support for any of the Matrix glTF extensions to your tool/engine/game let us know in the [Third Room chat](https://matrix.to/#/#thirdroom-dev:matrix.org).

## KHR (Khronos) Extensions

- [KHR_materials_unlit](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_unlit/README.md)
- [KHR_lights_punctual](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_lights_punctual/README.md) ** NOTE: In Three.js / Third Room the position/orientation of directional lights matters. Place them so that they frame the part of the scene you want to light. **
- [KHR_texture_transform](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md)
- [KHR_materials_emissive_strength](https://github.com/KhronosGroup/glTF/blob/c58e7e57184a4024dd1877dd9d219b198d6e0006/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md)
- [KHR_materials_ior](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_ior/README.md)
- [KHR_materials_transmission](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
- [KHR_materials_volume](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md)
- [KHR_texture_basisu](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)
- [KHR_audio](https://github.com/KhronosGroup/glTF/blob/5d3a2a35d139c72a7001aa4872041572b2e42fae/extensions/2.0/Khronos/KHR_audio/README.md) ** Note: This is a draft specification and still may have some subtle changes **

## EXT Extensions

- [EXT_mesh_gpu_instancing](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md)

## Vendor Extensions

- [OMI_collider](https://github.com/omigroup/gltf-extensions/tree/main/extensions/2.0/OMI_collider) ** Note: This extension is still under development and may undergo some additional changes. We do not currently support the Hull / Compound colliders or the isTrigger property **
- [OMI_link](https://github.com/omigroup/gltf-extensions/tree/main/extensions/2.0/OMI_link)
- [MOZ_hubs_components](./MOZ_hubs_components/README) ** Note: Limited support. See docs. **

## MX (Matrix) Extensions

- [MX_background](./MX_background/README)
- [MX_character_controller](./MX_character_controller/README)
- [MX_lightmap](./MX_lightmap/README)
- [MX_lights_shadows](./MX_lights_shadows/README)
- [MX_portal](./MX_portal/README) ** DEPRECATED: Please use OMI_link instead **
- [MX_postprocessing](./MX_postprocessing/README)
- [MX_reflection_probes](./MX_reflection_probes/README)
- [MX_scene_ar](./MX_scene_ar/README)
- [MX_spawn_point](./MX_spawn_point/README)
- [MX_static](./MX_static/README)
- [MX_texture_rgbm](./MX_texture_rgbm/README)
- [MX_tiles_renderer](./MX_tiles_renderer/README)
