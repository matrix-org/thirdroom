import { BufferViewModule } from "./bufferView/bufferView.render";
import { CameraModule, CameraUpdateSystem } from "./camera/camera.render";
import { ImageModule } from "./image/image.render";
import { LightModule, LightUpdateSystem } from "./light/light.render";
import { MaterialModule, MaterialUpdateSystem } from "./material/material.render";
import { defineConfig } from "./module/module.common";
import { RendererModule } from "./renderer/renderer.render";
import { ResourceModule } from "./resource/resource.render";
import { SceneModule, SceneUpdateSystem } from "./scene/scene.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";
import { TextureModule, TextureUpdateSystem } from "./texture/texture.render";

export default defineConfig({
  modules: [
    ResourceModule,
    SceneModule,
    CameraModule,
    BufferViewModule,
    ImageModule,
    LightModule,
    TextureModule,
    MaterialModule,
    RendererModule,
    StatsModule,
  ],
  systems: [
    RenderThreadStatsSystem,
    SceneUpdateSystem,
    CameraUpdateSystem,
    LightUpdateSystem,
    MaterialUpdateSystem,
    TextureUpdateSystem,
  ],
});
