import { CameraModule, CameraUpdateSystem } from "./camera/camera.render";
import { EditorModule } from "./editor/editor.renderer";
import { ImageModule } from "./image/image.render";
import { LightModule, LightUpdateSystem } from "./light/light.render";
import { MaterialModule, MaterialUpdateSystem } from "./material/material.render";
import { defineConfig } from "./module/module.common";
import { RaycasterModule, RendererRaycasterSystem } from "./raycaster/raycaster.renderer";
import { RendererModule } from "./renderer/renderer.render";
import { ResourceModule } from "./resource/resource.render";
import { SceneModule, SceneUpdateSystem } from "./scene/scene.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";
import { TextureModule } from "./texture/texture.render";

export default defineConfig({
  modules: [
    ResourceModule,
    SceneModule,
    CameraModule,
    ImageModule,
    LightModule,
    TextureModule,
    MaterialModule,
    RendererModule,
    RaycasterModule,
    EditorModule,
    StatsModule,
  ],
  systems: [
    RendererRaycasterSystem,
    RenderThreadStatsSystem,
    SceneUpdateSystem,
    CameraUpdateSystem,
    LightUpdateSystem,
    MaterialUpdateSystem,
  ],
});
