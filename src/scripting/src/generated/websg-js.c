
#include "websg-js.h"
#include "../../include/quickjs/quickjs.h"
#include "nametag.h"
#include "sampler.h"
#include "buffer.h"
#include "buffer-view.h"
#include "audio-data.h"
#include "audio-source.h"
#include "media-stream-source.h"
#include "audio-emitter.h"
#include "image.h"
#include "texture.h"
#include "reflection-probe.h"
#include "material.h"
#include "light.h"
#include "camera.h"
#include "sparse-accessor.h"
#include "accessor.h"
#include "mesh-primitive.h"
#include "instanced-mesh.h"
#include "mesh.h"
#include "light-map.h"
#include "tiles-renderer.h"
#include "skin.h"
#include "interactable.h"
#include "node.h"
#include "scene.h"

void js_define_websg_api(JSContext *ctx, JSValue *global) {
  JSValue jsSceneGraphNamespace = JS_NewObject(ctx);
  js_define_nametag_api(ctx, &jsSceneGraphNamespace);
  js_define_sampler_api(ctx, &jsSceneGraphNamespace);
  js_define_buffer_api(ctx, &jsSceneGraphNamespace);
  js_define_buffer_view_api(ctx, &jsSceneGraphNamespace);
  js_define_audio_data_api(ctx, &jsSceneGraphNamespace);
  js_define_audio_source_api(ctx, &jsSceneGraphNamespace);
  js_define_media_stream_source_api(ctx, &jsSceneGraphNamespace);
  js_define_audio_emitter_api(ctx, &jsSceneGraphNamespace);
  js_define_image_api(ctx, &jsSceneGraphNamespace);
  js_define_texture_api(ctx, &jsSceneGraphNamespace);
  js_define_reflection_probe_api(ctx, &jsSceneGraphNamespace);
  js_define_material_api(ctx, &jsSceneGraphNamespace);
  js_define_light_api(ctx, &jsSceneGraphNamespace);
  js_define_camera_api(ctx, &jsSceneGraphNamespace);
  js_define_sparse_accessor_api(ctx, &jsSceneGraphNamespace);
  js_define_accessor_api(ctx, &jsSceneGraphNamespace);
  js_define_mesh_primitive_api(ctx, &jsSceneGraphNamespace);
  js_define_instanced_mesh_api(ctx, &jsSceneGraphNamespace);
  js_define_mesh_api(ctx, &jsSceneGraphNamespace);
  js_define_light_map_api(ctx, &jsSceneGraphNamespace);
  js_define_tiles_renderer_api(ctx, &jsSceneGraphNamespace);
  js_define_skin_api(ctx, &jsSceneGraphNamespace);
  js_define_interactable_api(ctx, &jsSceneGraphNamespace);
  js_define_node_api(ctx, &jsSceneGraphNamespace);
  js_define_scene_api(ctx, &jsSceneGraphNamespace);
  JS_SetPropertyStr(ctx, *global, "WebSG", jsSceneGraphNamespace);
}
