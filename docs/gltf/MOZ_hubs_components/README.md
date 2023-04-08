# MOZ_hubs_components

This extension is maintained by the Mozilla Hubs team, but is currently undocumented.

Assets using the MOZ_hubs_components extension can be exported from:

- [Mozilla Spoke](https://hubs.mozilla.com/spoke)
- [hubs-blender-exporter](https://github.com/MozillaReality/hubs-blender-exporter)

Third Room currently has partial support for MOZ_hubs_components including the following components:

- spawn-point
- waypoint
- trimesh
- nav-mesh
- scene-preview-camera

Due to the way certain assets are referenced in MOZ_hubs_components, we can't support the full MOZ_hubs_components API. Unlike Matrix, Hubs' servers do not serve assets with proper CORS headers that allow for using assets across different domains. The extension is also very large and undocumented making it hard for us to implement everything. However, we do want to add support for more of the components in the future.

If you'd like to get an idea of what other components exist you can read through the component definitions in the hubs-blender-exporter source code [here](https://github.com/MozillaReality/hubs-blender-exporter/tree/master/addons/io_hubs_addon/components/definitions).
