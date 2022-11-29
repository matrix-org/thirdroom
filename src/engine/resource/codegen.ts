import path from "path";
import { existsSync } from "fs";
import { mkdir, rm, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

import { TypedArrayConstructor32 } from "../allocator/types";
import camelToSnakeCase from "../utils/camelToSnakeCase";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import kebabToSnakeCase from "../utils/kebabToSnakeCase";
import { ResourceDefinition, ResourcePropDef } from "./ResourceDefinition";
import * as SchemaModule from "./schema";
import camelToPascalCase from "../utils/camelToPascalCase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const arrayToCType = new Map<TypedArrayConstructor32, string>([
  [Float32Array, "float_t"],
  [Uint32Array, "unsigned int"],
  [Int32Array, "int"],
  [Uint8Array, "unsigned char"],
  [Uint16Array, "unsigned short"],
  [Int8Array, "char"],
  [Int16Array, "short"],
]);

function resolveRefDefinition(resourceDef: ResourceDefinition | string): ResourceDefinition {
  if (typeof resourceDef === "string") {
    const def = Object.values(SchemaModule).find((value) => "schema" in value && value.name === resourceDef) as
      | ResourceDefinition
      | undefined;

    if (!def) {
      throw new Error(`Cannot resolve resource definition`);
    }

    return def;
  }

  return resourceDef;
}

// This works well enough for our schema as of now. Will need to be expanded on later.
function depluralize(str: string): string {
  return str.endsWith("s") ? str.substring(0, str.length - 1) : str;
}

function generateProp(
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>,
  resourceDef: ResourceDefinition
): string {
  const propNameSnake = camelToSnakeCase(propNameCamel);

  if (propDef.type === "enum") {
    let [enumName] = Object.entries(SchemaModule).find(([name, value]) => value === propDef.enumType) || [];

    if (!enumName) {
      console.warn(`Cannot define enum property ${propNameCamel} with enum type: ${enumName}`);
      enumName = "int";
    }

    return `${enumName} ${propNameSnake}`;
  } else if (propDef.type === "ref") {
    const refDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);

    if (!refDef) {
      throw new Error(`Cannot define ref property ${propNameCamel}: resourceDef is undefined.`);
    }

    return `${kebabToPascalCase(refDef.name)} *${propNameSnake}`;
  } else if (propDef.type === "refArray" || propDef.type === "refMap") {
    const refDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);

    if (!refDef) {
      throw new Error(`Cannot define ${propDef.type} property ${propNameCamel}: resourceDef is undefined.`);
    }

    return `${kebabToPascalCase(refDef.name)} *${propNameSnake}[${propDef.size}]`;
  } else if (propDef.type === "bool") {
    return `int ${propNameSnake}`;
  } else if (propDef.type === "bitmask") {
    return `unsigned int ${propNameSnake}`;
  } else if (propDef.type === "string") {
    return `const char *${propNameSnake}`;
  } else if (propDef.arrayType === Float32Array && propDef.size > 1) {
    const typeName = arrayToCType.get(propDef.arrayType);

    if (!typeName) {
      throw new Error(`Cannot find array type name for property ${propNameCamel}`);
    }

    return `${typeName} ${propNameSnake}[${propDef.size}]`;
  } else if (propDef.type === "arrayBuffer") {
    return `ArrayBuffer ${propNameSnake}`;
  } else {
    const typeName = arrayToCType.get(propDef.arrayType);

    if (!typeName) {
      throw new Error(`Cannot find array type name for property ${propNameCamel}`);
    }

    return `${typeName} ${propNameSnake}`;
  }
}

function generateWebSGHeader() {
  const chunks: string[] = [];

  chunks.push(`
#ifndef __websg_h
#define __websg_h
#include <math.h>

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

typedef struct ArrayBuffer {
  unsigned int size;
  unsigned char *buf;
} ArrayBuffer;`);

  const predefinedStructs = new Set<string>();

  for (const value of Object.values(SchemaModule)) {
    if ("schema" in value) {
      for (const prop of Object.values(value.schema)) {
        if ((prop.type === "ref" || prop.type === "refArray") && typeof prop.resourceDef === "string") {
          predefinedStructs.add(value.name);
          predefinedStructs.add(prop.resourceDef);
        }
      }
    }
  }

  for (const predefinedStruct of predefinedStructs) {
    const classNamePascal = kebabToPascalCase(predefinedStruct);
    chunks.push(`typedef struct _${classNamePascal} ${classNamePascal};`);
  }

  for (const [name, value] of Object.entries(SchemaModule)) {
    if ("schema" in value) {
      const classNamePascal = kebabToPascalCase(value.name);

      // ResourceDefinitions
      chunks.push(/* c */ `
typedef struct ${predefinedStructs.has(value.name) ? "_" : ""}${classNamePascal} {
${Object.entries(value.schema)
  .map(([propName, propDef]) => `  ${generateProp(propName, propDef, value)};`)
  .filter((val) => !!val)
  .join("\n")}
} ${classNamePascal};`);
    } else {
      // enums
      chunks.push(/* c */ `
typedef enum ${name} {
${Object.entries(value)
  .filter(([k, v]) => typeof v === "number")
  .map(([k, v]) => `  ${name}_${k} = ${v},`)
  .join("\n")}
} ${name};`);
    }
  }

  chunks.push(`
import_websg(get_resource_by_name) void *websg_get_resource_by_name(ResourceType type, const char *name);
import_websg(create_resource) int websg_create_resource(ResourceType type, void *resource);
import_websg(dispose_resource) int websg_dispose_resource(void *resource);

#endif`);

  return chunks.map((chunk) => chunk.trim()).join("\n\n");
}

function isRefType(propType: string): boolean {
  return propType === "ref" || propType === "refArray" || propType === "refMap";
}

function getRefDependencies(resourceDef: ResourceDefinition): string[] {
  const dependencies = new Set<string>([resourceDef.name]);

  for (const key in resourceDef.schema) {
    const propDef = resourceDef.schema[key];

    if (isRefType(propDef.type)) {
      dependencies.add(resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string).name);
    }
  }

  return Array.from(dependencies);
}

function generateJSPropGetValueStatement(
  destNameSnake: string,
  srcNameSnake: string,
  propNameSnake: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  const srcVar = `${srcNameSnake}->${propNameSnake}`;
  if (propDef.type === "string") {
    return /* c */ `${destNameSnake} = JS_NewString(ctx, ${srcVar});`;
  } else if (propDef.type === "bool") {
    return /* c */ `${destNameSnake} = JS_NewBool(ctx, ${srcVar});`;
  } else if (propDef.type === "i32") {
    return /* c */ `${destNameSnake} = JS_NewInt32(ctx, ${srcVar});`;
  } else if (propDef.type === "enum" || propDef.type === "u32" || propDef.type === "bitmask") {
    return /* c */ `${destNameSnake} = JS_NewUint32(ctx, ${srcVar});`;
  } else if (propDef.type === "f32") {
    return /* c */ `${destNameSnake} = JS_NewFloat64(ctx, (double)${srcVar});`;
  } else if (propDef.type === "ref") {
    const refResourceDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);
    const classNameSnake = kebabToSnakeCase(refResourceDef.name);
    return /* c */ `${destNameSnake} = create_${classNameSnake}_from_ptr(ctx, ${srcVar});`;
  } else {
    throw new Error(`undefined getter for ${propDef.type}`);
  }
}

function generateJSPropSetValueStatement(
  srcNameSnake: string,
  destNameSnake: string,
  propNameSnake: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  const destVar = `${destNameSnake}->${propNameSnake}`;
  if (propDef.type === "string") {
    return /* c */ `${destVar} = JS_ToCString(ctx, ${srcNameSnake});`;
  } else if (propDef.type === "bool") {
    return /* c */ `${destVar} = JS_ToBool(ctx, ${srcNameSnake});`;
  } else if (propDef.type === "i32") {
    return /* c */ `if (JS_ToInt32(ctx, &${destVar}, ${srcNameSnake})) return JS_EXCEPTION;`;
  } else if (propDef.type === "enum" || propDef.type === "u32" || propDef.type === "bitmask") {
    return /* c */ `if (JS_ToUint32(ctx, &${destVar}, ${srcNameSnake})) return JS_EXCEPTION;`;
  } else if (propDef.type === "f32") {
    return /* c */ `if (JS_ToFloat32(ctx, &${destVar}, ${srcNameSnake})) return JS_EXCEPTION;`;
  } else if (propDef.type === "ref") {
    const refResourceDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);
    const classNameSnake = kebabToSnakeCase(refResourceDef.name);
    return /* c */ `${destVar} = JS_GetOpaque(${srcNameSnake}, js_${classNameSnake}_class_id);`;
  } else {
    throw new Error(`undefined setter for ${propDef.type}`);
  }
}

function generateJSPropGetter(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  const propNameSnake = camelToSnakeCase(propNameCamel);

  return `
static JSValue js_${classNameSnake}_get_${propNameSnake}(JSContext *ctx, JSValueConst this_val) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    ${generateJSPropGetValueStatement("val", classNameSnake, propNameSnake, propDef)}
    return val;
  }
}
`;
}

function generateJSPropSetter(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  const propNameSnake = camelToSnakeCase(propNameCamel);

  return `
static JSValue js_${classNameSnake}_set_${propNameSnake}(JSContext *ctx, JSValueConst this_val, JSValue val) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    ${generateJSPropSetValueStatement("val", classNameSnake, propNameSnake, propDef)}
    return JS_UNDEFINED;
  }
}
`;
}

function generateJSRefArrayPropFunctions(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  const propNameSnake = camelToSnakeCase(propNameCamel);
  const refDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);
  const refClassNameSnake = kebabToSnakeCase(refDef.name);
  const depluralizedPropNameSnake = depluralize(propNameSnake);

  return /* c */ `static JSValue js_${classNameSnake}_${propNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefArrayIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_${refClassNameSnake}_from_ptr, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}));
  }
}

static JSValue js_${classNameSnake}_add_${depluralizedPropNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_AddRefArrayItem(ctx, js_${refClassNameSnake}_class_id, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}), argv[0]);
  }
}

static JSValue js_${classNameSnake}_remove_${depluralizedPropNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_RemoveRefArrayItem(ctx, js_${refClassNameSnake}_class_id, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}), argv[0]);
  }
}`;
}

function generateJSRefMapPropFunctions(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  const propNameSnake = camelToSnakeCase(propNameCamel);
  const refDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);
  const refClassNameSnake = kebabToSnakeCase(refDef.name);
  const depluralizedPropNameSnake = depluralize(propNameSnake);

  return /* c */ `static JSValue js_${classNameSnake}_${propNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefMapIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_${refClassNameSnake}_from_ptr, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}));
  }
}
  
static JSValue js_${classNameSnake}_get_${depluralizedPropNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_GetRefMapItem(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_${refClassNameSnake}_from_ptr, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}), argv[0]);
  }
}

static JSValue js_${classNameSnake}_set_${depluralizedPropNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_SetRefMapItem(ctx, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}), argv[0], argv[1]);
  }
}

static JSValue js_${classNameSnake}_delete_${depluralizedPropNameSnake}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!${classNameSnake}) {
    return JS_EXCEPTION;
  } else {
    return JS_DeleteRefMapItem(ctx, (void **)${classNameSnake}->${propNameSnake}, countof(${classNameSnake}->${propNameSnake}), argv[0]);
  }
}`;
}

function generateJSPropBinding(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  if (
    !propDef.script ||
    (propDef.size !== 1 && propDef.type !== "refArray" && propDef.type !== "refMap") ||
    propDef.type == "arrayBuffer"
  ) {
    return "";
  }

  const chunks: string[] = [];

  if (propDef.type === "refArray") {
    chunks.push(generateJSRefArrayPropFunctions(classNameSnake, classNamePascal, propNameCamel, propDef));
  } else if (propDef.type === "refMap") {
    chunks.push(generateJSRefMapPropFunctions(classNameSnake, classNamePascal, propNameCamel, propDef));
  } else {
    chunks.push(generateJSPropGetter(classNameSnake, classNamePascal, propNameCamel, propDef));

    if (propDef.mutableScript) {
      chunks.push(generateJSPropSetter(classNameSnake, classNamePascal, propNameCamel, propDef));
    }
  }

  return chunks.join("\n");
}
function generateJSPropFunctionListEntries(
  classNameSnake: string,
  propName: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string[] {
  if (
    !propDef.script ||
    propDef.type === "arrayBuffer" ||
    (propDef.size !== 1 && propDef.type !== "refArray" && propDef.type !== "refMap")
  ) {
    return [];
  }

  const propNameSnake = camelToSnakeCase(propName);
  const depluralizedPropNameSnake = depluralize(propNameSnake);
  const propNamePascal = depluralize(camelToPascalCase(propName));

  if (propDef.type === "refArray") {
    return [
      `JS_CFUNC_DEF("${propName}", 0, js_${classNameSnake}_${propNameSnake})`,
      `JS_CFUNC_DEF("add${propNamePascal}", 1, js_${classNameSnake}_add_${depluralizedPropNameSnake})`,
      `JS_CFUNC_DEF("remove${propNamePascal}", 1, js_${classNameSnake}_remove_${depluralizedPropNameSnake})`,
    ];
  } else if (propDef.type === "refMap") {
    return [
      `JS_CFUNC_DEF("${propName}", 0, js_${classNameSnake}_${propNameSnake})`,
      `JS_CFUNC_DEF("get${propNamePascal}", 1, js_${classNameSnake}_get_${depluralizedPropNameSnake})`,
      `JS_CFUNC_DEF("set${propNamePascal}", 1, js_${classNameSnake}_set_${depluralizedPropNameSnake})`,
      `JS_CFUNC_DEF("delete${propNamePascal}", 1, js_${classNameSnake}_delete_${depluralizedPropNameSnake})`,
    ];
  } else {
    if (propDef.mutableScript) {
      return [
        `JS_CGETSET_DEF("${propName}", js_${classNameSnake}_get_${propNameSnake}, js_${classNameSnake}_set_${propNameSnake})`,
      ];
    }

    return [`JS_CGETSET_DEF("${propName}", js_${classNameSnake}_get_${propNameSnake}, NULL)`];
  }
}

// function generateSceneFunctions(): string {
//   return /* c */ `static JSValue js_scene_nodes(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
//   Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

//   if (!scene) {
//     return JS_EXCEPTION;
//   } else {
//     return JS_NewNodeIterator(ctx, scene->first_node);
//   }
// }

// static JSValue js_scene_add_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
//   Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

//   if (!scene) {
//     return JS_EXCEPTION;
//   }

//   Node *node = JS_GetOpaque2(ctx, argv[0], js_node_class_id);

//   if (!node) {
//     return JS_EXCEPTION;
//   }

//   Node *before;

//   if (argc > 1) {
//     before = JS_GetOpaque2(ctx, argv[0], js_node_class_id);

//     if (!before) {
//       return JS_EXCEPTION;
//     }
//   }

//   if (before) {
//     if (scene_add_node_before(scene, before, node)) {
//       return JS_EXCEPTION;
//     }

//     return JS_UNDEFINED;
//   }

//   if (scene_append_node(scene, node)) {
//     return JS_EXCEPTION;
//   }

//   return JS_UNDEFINED;
// }

// static JSValue js_scene_remove_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
//   Scene *scene = JS_GetOpaque2(ctx, this_val, js_scene_class_id);

//   if (!scene) {
//     return JS_EXCEPTION;
//   }

//   Node *node = JS_GetOpaque2(ctx, argv[0], js_node_class_id);

//   if (!node) {
//     return JS_EXCEPTION;
//   }

//   if (scene_remove_node(scene, node)) {
//     return JS_EXCEPTION;
//   }

//   return JS_UNDEFINED;
// }`;
// }

// function generateNodeFunctions(): string {
//   return /* c */ `static JSValue js_node_get_parent(JSContext *ctx, JSValueConst this_val) {
//   Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

//   if (!node) {
//     return JS_EXCEPTION;
//   }

//   if (node->parent) {
//     return create_node_from_ptr(ctx, node->parent);
//   } else if (node->parent_scene) {
//     return create_scene_from_ptr(ctx, node->parent_scene);
//   }

//   return JS_UNDEFINED;
// }

// static JSValue js_node_children(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
//   Node *node = JS_GetOpaque2(ctx, this_val, js_node_class_id);

//   if (!node) {
//     return JS_EXCEPTION;
//   } else {
//     return JS_NewNodeIterator(ctx, node->first_child);
//   }
// }

// static JSValue js_node_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
//   Node *parent = JS_GetOpaque2(ctx, this_val, js_node_class_id);

//   if (!parent) {
//     return JS_EXCEPTION;
//   }

//   Node *child = JS_GetOpaque2(ctx, argv[0], js_node_class_id);

//   if (!child) {
//     return JS_EXCEPTION;
//   }

//   Node *before;

//   if (argc > 1) {
//     before = JS_GetOpaque2(ctx, argv[0], js_node_class_id);

//     if (!before) {
//       return JS_EXCEPTION;
//     }
//   }

//   if (before) {
//     if (node_add_child_before(parent, before, child)) {
//       return JS_EXCEPTION;
//     }

//     return JS_UNDEFINED;
//   }

//   if (node_append_child(parent, child)) {
//     return JS_EXCEPTION;
//   }

//   return JS_UNDEFINED;
// }

// static JSValue js_node_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
//   Node *parent = JS_GetOpaque2(ctx, this_val, js_node_class_id);

//   if (!parent) {
//     return JS_EXCEPTION;
//   }

//   Node *child = JS_GetOpaque2(ctx, argv[0], js_node_class_id);

//   if (!child) {
//     return JS_EXCEPTION;
//   }

//   if (node_remove_child(parent, child)) {
//     return JS_EXCEPTION;
//   }

//   return JS_UNDEFINED;
// }`;
// }

function generateResourceSpecificFunctions(resourceDef: ResourceDefinition): string {
  const chunks: string[] = [];

  // TODO:
  // if (resourceDef.name === "scene") {
  //   chunks.push(generateSceneFunctions());
  // } else if (resourceDef.name === "node") {
  //   chunks.push(generateNodeFunctions());
  // }

  return chunks.join("\n");
}

function generateResourceSpecificFunctionListEntries(resourceDef: ResourceDefinition): string[] {
  const entries: string[] = [];

  // TODO: Re-enable
  // if (resourceDef.name === "scene") {
  //   entries.push(
  //     `JS_CFUNC_DEF("nodes", 0, js_scene_nodes)`,
  //     `JS_CFUNC_DEF("addNode", 2, js_scene_add_node)`,
  //     `JS_CFUNC_DEF("removeNode", 1, js_scene_remove_node)`
  //   );
  // } else if (resourceDef.name === "node") {
  //   entries.push(
  //     `JS_CGETSET_DEF("parent", js_node_get_parent, NULL)`,
  //     `JS_CFUNC_DEF("children", 0, js_node_children)`,
  //     `JS_CFUNC_DEF("addChild", 2, js_node_add_child)`,
  //     `JS_CFUNC_DEF("removeChild", 1, js_node_remove_child)`
  //   );
  // }

  return entries;
}

function generateConstructorArgParsing(resourceDef: ResourceDefinition, varName: string): string {
  // TODO
  return "";
}

function generateArrayPropDefinitions(resourceDef: ResourceDefinition): string {
  const chunks: string[] = [];

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (prop.size > 1 && prop.type !== "refArray" && prop.type !== "refMap" && prop.type !== "arrayBuffer") {
      const propVar = `${kebabToSnakeCase(resourceDef.name)}->${camelToSnakeCase(propName)}`;
      chunks.push(`JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "${propName}", ${propVar}, ${prop.size});`);
    } else if (prop.type === "arrayBuffer") {
      const propVar = `${kebabToSnakeCase(resourceDef.name)}->${camelToSnakeCase(propName)}`;
      chunks.push(`JS_DefineReadOnlyArrayBufferProperty(ctx, val, "${propName}", ${propVar});`);
    }
  }

  return chunks.join("\n");
}

function generateResourceJSBindings(resourceDef: ResourceDefinition) {
  const classNamePascal = kebabToPascalCase(resourceDef.name);
  const classNameSnake = kebabToSnakeCase(resourceDef.name);

  const dependencies = getRefDependencies(resourceDef);

  const chunks: string[] = [];

  chunks.push(/* c */ `
#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../../include/quickjs/cutils.h"
#include "../../include/quickjs/quickjs.h"

#include "../jsutils.h"
#include "../websg-utils.h"
#include "../script-context.h"
#include "websg.h"
${dependencies.map((name) => `#include "${name}.h"`).join("\n")}

/**
 * WebSG.${classNamePascal}
 */

JSClassID js_${classNameSnake}_class_id;

static JSValue js_${classNameSnake}_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = js_mallocz(ctx, sizeof(${classNamePascal}));

  ${generateConstructorArgParsing(resourceDef, classNameSnake)}

  if (websg_create_resource(ResourceType_${classNamePascal}, ${classNameSnake})) {
    return JS_EXCEPTION;
  }

  return create_${classNameSnake}_from_ptr(ctx, ${classNameSnake});
}

${Object.entries(resourceDef.schema)
  .map(([propName, propDef]) => generateJSPropBinding(classNameSnake, classNamePascal, propName, propDef))
  .filter((val) => !!val)
  .join("\n")}

${generateResourceSpecificFunctions(resourceDef)}

static JSValue js_${classNameSnake}_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = JS_GetOpaque(this_val, js_${classNameSnake}_class_id);
  websg_dispose_resource(${classNameSnake});
  js_free(ctx, ${classNameSnake});
  return JS_UNDEFINED;
}

static JSClassDef js_${classNameSnake}_class = {
  "${classNamePascal}"
};

static const JSCFunctionListEntry js_${classNameSnake}_proto_funcs[] = {
${Object.entries(resourceDef.schema)
  .flatMap(([propName, propDef]) => generateJSPropFunctionListEntries(classNameSnake, propName, propDef))
  .concat(generateResourceSpecificFunctionListEntries(resourceDef))
  .filter((val) => !!val)
  .map((val) => `  ${val},`)
  .join("\n")}
  JS_CFUNC_DEF("dispose", 0, js_${classNameSnake}_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "${classNamePascal}", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_${classNameSnake}_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_${classNameSnake}_class_id);
  JS_NewClass(rt, js_${classNameSnake}_class_id, &js_${classNameSnake}_class);

  JSValue ${classNameSnake}_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, ${classNameSnake}_proto, js_${classNameSnake}_proto_funcs, countof(js_${classNameSnake}_proto_funcs));
  
  JSValue ${classNameSnake}_class = JS_NewCFunction2(ctx, js_${classNameSnake}_constructor, "${classNamePascal}", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, ${classNameSnake}_class, ${classNameSnake}_proto);
  JS_SetClassProto(ctx, js_${classNameSnake}_class_id, ${classNameSnake}_proto);

  return ${classNameSnake}_class;
}

/**
 * WebSG.${classNamePascal} related functions
*/

static JSValue js_get_${classNameSnake}_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  ${classNamePascal} *${classNameSnake} = websg_get_resource_by_name(ResourceType_${classNamePascal}, name);
  JS_FreeCString(ctx, name);
  return create_${classNameSnake}_from_ptr(ctx, ${classNameSnake});
}

JSValue create_${classNameSnake}_from_ptr(JSContext *ctx, ${classNamePascal} *${classNameSnake}) {
  if (!${classNameSnake}) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, ${classNameSnake});

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_${classNameSnake}_class_id);
    ${generateArrayPropDefinitions(resourceDef)}
    JS_SetOpaque(val, ${classNameSnake});
    set_js_val_from_ptr(ctx, ${classNameSnake}, val);
  }

  return val;
}

void js_define_${classNameSnake}_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "${classNamePascal}", js_define_${classNameSnake}_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "get${classNamePascal}ByName",
    JS_NewCFunction(ctx, js_get_${classNameSnake}_by_name, "get${classNamePascal}ByName", 1)
  );
}
`);

  return chunks.map((chunk) => chunk.trim()).join("\n\n");
}

function generateResourceJSHeader(resourceDef: ResourceDefinition) {
  const classNamePascal = kebabToPascalCase(resourceDef.name);
  const classNameSnake = kebabToSnakeCase(resourceDef.name);

  return `
#ifndef __${classNameSnake}_h
#define __${classNameSnake}_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_${classNameSnake}_class_id;

JSValue create_${classNameSnake}_from_ptr(JSContext *ctx, ${classNamePascal} *${classNameSnake});

void js_define_${classNameSnake}_api(JSContext *ctx, JSValue *target);

#endif`;
}

function generateWebSGJSBindings(): string {
  const resourceDefs = Object.values(SchemaModule).filter((val) => "schema" in val) as ResourceDefinition[];

  return /* c */ `
#include "websg-js.h"
#include "../../include/quickjs/quickjs.h"
${resourceDefs.map((val) => `#include "${val.name}.h"`).join("\n")}

void js_define_websg_api(JSContext *ctx, JSValue *global) {
  JSValue jsSceneGraphNamespace = JS_NewObject(ctx);
${resourceDefs.map((val) => `  js_define_${kebabToSnakeCase(val.name)}_api(ctx, &jsSceneGraphNamespace);`).join("\n")}
  JS_SetPropertyStr(ctx, *global, "WebSG", jsSceneGraphNamespace);
}
`;
}

function generateWebSGJSHeader(): string {
  return /* c */ `
#ifndef __websg_js_h
#define __websg_js_h
#include "../../include/quickjs/quickjs.h"

void js_define_websg_api(JSContext *ctx, JSValue *global);

#endif`;
}

async function main() {
  const outDir = path.resolve(__dirname, "../../scripting/src/generated");

  if (existsSync(outDir)) {
    await rm(outDir, { recursive: true });
  }

  await mkdir(outDir);

  await writeFile(path.resolve(outDir, "websg.h"), generateWebSGHeader());

  for (const [, value] of Object.entries(SchemaModule)) {
    if ("schema" in value) {
      await writeFile(path.resolve(outDir, `${value.name}.c`), generateResourceJSBindings(value));
      await writeFile(path.resolve(outDir, `${value.name}.h`), generateResourceJSHeader(value));
    }
  }

  await writeFile(path.resolve(outDir, "websg-js.c"), generateWebSGJSBindings());
  await writeFile(path.resolve(outDir, "websg-js.h"), generateWebSGJSHeader());
}

main().catch(console.error);
