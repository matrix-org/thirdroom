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

function generateProp(
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
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
    const resourceDef = propDef.resourceDef as ResourceDefinition | undefined;

    if (!resourceDef) {
      throw new Error(`Cannot define ref property ${propNameCamel}: resourceDef is undefined.`);
    }

    return `${kebabToPascalCase(resourceDef.name)} *${propNameSnake}`;
  } else if (propDef.type === "refArray") {
    const resourceDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);

    if (!resourceDef) {
      throw new Error(`Cannot define refArray property ${propNameCamel}: resourceDef is undefined.`);
    }

    return `${kebabToPascalCase(resourceDef.name)} *${propNameSnake}[${propDef.size}]`;
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
  } else {
    const typeName = arrayToCType.get(propDef.arrayType);

    if (!typeName) {
      throw new Error(`Cannot find array type name for property ${propNameCamel}`);
    }

    return `${typeName} ${propNameSnake}`;
  }
}

function generatePropSetter(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string | undefined {
  const propType = propDef.type;

  if (!(propType === "string" || propType === "arrayBuffer" || propType === "ref" || propType === "refArray")) {
    return undefined;
  }

  if (!propDef.mutable) {
    return undefined;
  }

  const propNameSnake = camelToSnakeCase(propNameCamel);

  return `import_websg(set_${classNameSnake}_${propNameSnake}) int websg_set_${classNameSnake}_${propNameSnake}(${classNamePascal} *${classNameSnake}, ${generateProp(
    propNameCamel,
    propDef
  )});`;
}

function generateWebSGHeader() {
  const chunks: string[] = [];

  chunks.push(`
#ifndef __websg_h
#define __websg_h
#include <math.h>

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

export void *websg_allocate(int size);
export void websg_deallocate(void *ptr);`);

  for (const [name, value] of Object.entries(SchemaModule)) {
    if ("schema" in value) {
      const classNamePascal = kebabToPascalCase(value.name);
      const classNameSnake = kebabToSnakeCase(value.name);

      // ResourceDefinitions
      chunks.push(/* c */ `
typedef struct ${classNamePascal} {
${Object.entries(value.schema)
  .map(([propName, propDef]) => `  ${generateProp(propName, propDef)};`)
  .filter((val) => !!val)
  .join("\n")}
} ${classNamePascal};`);

      // WebSG APIs
      chunks.push(/* c */ `
import_websg(get_${classNameSnake}_by_name) ${classNamePascal} *websg_get_${classNameSnake}_by_name(const char *name);
import_websg(create_${classNameSnake}) websg_create_${classNameSnake}(${classNamePascal} *${classNameSnake});
${Object.entries(value.schema)
  .map(([propName, propDef]) => generatePropSetter(classNameSnake, classNamePascal, propName, propDef))
  .filter((val) => !!val)
  .join("\n")}
import_websg(dispose_${classNameSnake}) int websg_dispose_${classNameSnake}(${classNamePascal} *${classNameSnake});
  `);
    } else {
      // enums
      chunks.push(/* c */ `
  typedef enum ${name} {
  ${Object.entries(value)
    .filter(([k, v]) => typeof v === "number")
    .map(([k, v]) => `  ${k} = ${v},`)
    .join("\n")}
  } ${name};`);
    }
  }

  chunks.push(`#endif`);

  return chunks.map((chunk) => chunk.trim()).join("\n\n");
}

function isRefType(propType: string): boolean {
  return propType === "ref" || propType === "refArray";
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

function getJSValueConstructor(
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>,
  paramName: string
): string {
  if (propDef.type === "refArray") {
    return `JSValue val = JS_NewIteratorFromPtr(ctx, ${paramName}, countof(${paramName}));`;
  } else if (propDef.type === "string") {
    return `JSValue val = JS_NewString(ctx, ${paramName});`;
  } else if (propDef.type === "i32") {
    return `JSValue val = JS_NewInt32(ctx, ${paramName});`;
  } else if (propDef.type === "enum" || propDef.type === "u32" || propDef.type === "bitmask") {
    return `JSValue val = JS_NewUint32(ctx, ${paramName});`;
  } else if (propDef.type === "f32") {
    return `JSValue val = JS_NewFloat64(ctx, ${paramName});`;
  } else if (propDef.type === "bool") {
    return `JSValue val = JS_NewBool(ctx, ${paramName});`;
  } else if (propDef.type === "ref") {
    const refName = kebabToSnakeCase((propDef.resourceDef as ResourceDefinition).name);
    return `JSValue val = create_${refName}_from_ptr(ctx, ${paramName});`;
  } else {
    throw new Error(`undefined setter for ${propDef.type}`);
  }
}

function getJSValueDeserializer(
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>,
  valName = "val",
  varName = "result"
): string {
  if (propDef.type === "string") {
    return `const char *${varName} = JS_ToCString(ctx, ${valName});`;
  } else if (propDef.type === "i32") {
    return `
int32_t ${varName};

if (JS_ToInt32(ctx, &${varName}, ${valName})) {
  return JS_EXCEPTION;
}`;
  } else if (propDef.type === "enum" || propDef.type === "u32" || propDef.type === "bitmask") {
    return `
uint32_t ${varName};

if (JS_ToUint32(ctx, &${varName}, ${valName})) {
  return JS_EXCEPTION;
}`;
  } else if (propDef.type === "f32") {
    return `
float_t ${varName};

if (JS_ToFloat64(ctx, &${varName}, ${valName})) {
  return JS_EXCEPTION;
}`;
  } else if (propDef.type === "bool") {
    return `int ${varName} = JS_ToBool(ctx, ${valName});`;
  } else if (propDef.type === "ref") {
    const refResourceDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);
    const classNamePascal = kebabToPascalCase(refResourceDef.name);
    const classNameSnake = kebabToSnakeCase(refResourceDef.name);
    return `${classNamePascal} *${varName} = get_${classNameSnake}_from_js_val(ctx, ${valName});`;
  } else if (propDef.type === "refArray") {
    const refResourceDef = resolveRefDefinition(propDef.resourceDef as ResourceDefinition | string);

    return /* c */ `
      ${kebabToPascalCase(refResourceDef.name)} *${varName}[${propDef.size}] = malloc(sizeof(size_t) * ${propDef.size});
      JSValue len = JS_GetProperty(ctx, ${valName}, "length");
      int size = JS_VALUE_GET_INT(len);

      for (int i = 0; i < size && i < ${propDef.size}; i++) {
        ${varName}[i] = JS_GetPropertyUint32(ctx, ${valName}, i);
      }
    `;
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
  const jsValueConstructor = getJSValueConstructor(
    propDef,
    propDef.size > 1 && propDef.type !== "refArray"
      ? `js${classNamePascal}->${propNameSnake}`
      : `js${classNamePascal}->${classNameSnake}->${propNameSnake}`
  );

  return `
static JSValue js_${classNameSnake}_get_${propNameSnake}(JSContext *ctx, JSValueConst this_val) {
  JS${classNamePascal} *js${classNamePascal} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!js${classNamePascal}) {
    return JS_EXCEPTION;
  } else {
    ${jsValueConstructor}
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
  JS${classNamePascal} *js${classNamePascal} = JS_GetOpaque2(ctx, this_val, js_${classNameSnake}_class_id);

  if (!js${classNamePascal}) {
    return JS_EXCEPTION;
  } else {
    ${getJSValueDeserializer(propDef)}
    websg_set_${classNameSnake}_${propNameSnake}(js${classNamePascal}->${classNameSnake}, result);
    return JS_UNDEFINED;
  }
}
`;
}

function generateJSPropBinding(
  classNameSnake: string,
  classNamePascal: string,
  propNameCamel: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string {
  if (!propDef.script || propDef.size !== 1 || propDef.type === "arrayBuffer") {
    return "";
  }

  const chunks: string[] = [];

  chunks.push(generateJSPropGetter(classNameSnake, classNamePascal, propNameCamel, propDef));

  if (propDef.mutable) {
    chunks.push(generateJSPropSetter(classNameSnake, classNamePascal, propNameCamel, propDef));
  }

  return chunks.join("\n");
}
function generateJSPropFunctionListEntry(
  classNameSnake: string,
  propName: string,
  propDef: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>
): string | undefined {
  if (!propDef.script || propDef.type === "arrayBuffer" || propDef.size !== 1) {
    return undefined;
  }

  const propNameSnake = camelToSnakeCase(propName);

  if (propDef.mutable) {
    return `JS_CGETSET_DEF("${propName}", js_${classNameSnake}_get_${propNameSnake}, js_${classNameSnake}_set_${propNameSnake}),`;
  }

  return `JS_CGETSET_DEF("${propName}", js_${classNameSnake}_get_${propNameSnake}, NULL),`;
}

function getConstructorArgParams(resourceDef: ResourceDefinition): string {
  const chunks: string[] = [];

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (prop.required) {
      chunks.push(camelToSnakeCase(propName));
    }
  }

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (!prop.required && !prop.mutable) {
      chunks.push(camelToSnakeCase(propName));
    }
  }

  return chunks.join(", ");
}

function generateConstructorArgParsing(resourceDef: ResourceDefinition, varName: string): string {
  const chunks: string[] = [];

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (prop.required && prop.type !== "arrayBuffer") {
      chunks.push(getJSValueDeserializer(prop, camelToSnakeCase(propName)));
    }
  }

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (!prop.required && !prop.mutable && prop.type !== "arrayBuffer") {
      chunks.push(getJSValueDeserializer(prop, camelToSnakeCase(propName)));
    }
  }

  return chunks.join("\n");
}

function generateTypedArrayPropDefinitions(resourceDef: ResourceDefinition): string {
  const chunks: string[] = [];

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (prop.size > 1) {
      const propVar = `${kebabToSnakeCase(resourceDef.name)}->${camelToSnakeCase(propName)}`;
      chunks.push(`JSValue arr = JS_CreateFloat32Array(ctx, ${propVar}, ${prop.size});
JS_DefineReadOnlyPropertyValueStr(ctx, val, "${propName}", arr);`);
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
#include "../script-context.h"
#include "websg.h"
${dependencies.map((name) => `#include "${name}.h"`).join("\n")}

/**
 * WebSG.${classNamePascal}
 */

typedef struct JS${classNamePascal} {
  ${classNamePascal} *${classNameSnake};
} JS${classNamePascal};

static JSClassID js_${classNameSnake}_class_id;

static JSValue js_${classNameSnake}_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  ${classNamePascal} *${classNameSnake} = malloc(sizeof(${classNamePascal}));

  ${generateConstructorArgParsing(resourceDef, classNameSnake)}

  if (websg_create_${classNameSnake}(${classNameSnake})) {
    return JS_EXCEPTION;
  }

  JSValue val = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  if (JS_IsException(proto)) {
    websg_dispose_${classNameSnake}(${classNameSnake});
    JS_FreeValue(ctx, proto);
    return JS_EXCEPTION;
  }
    
  val = JS_NewObjectProtoClass(ctx, proto, js_${classNameSnake}_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(val)) {
    websg_dispose_texture(${classNameSnake});
    JS_FreeValue(ctx, val);
    return JS_EXCEPTION;
  }

  ${generateTypedArrayPropDefinitions(resourceDef)}

  JS${classNamePascal} *js${classNamePascal} = js_malloc(ctx, sizeof(JS${classNamePascal}));
  js${classNamePascal}->${classNameSnake} = ${classNameSnake};
  JS_SetOpaque(val, js${classNamePascal});
  set_js_val_from_ptr(ctx, ${classNameSnake}, val);

  return val;
}

${Object.entries(resourceDef.schema)
  .map(([propName, propDef]) => generateJSPropBinding(classNameSnake, classNamePascal, propName, propDef))
  .filter((val) => !!val)
  .join("\n")}

static void js_${classNameSnake}_finalizer(JSRuntime *rt, JSValue val) {
  JS${classNamePascal} *js${classNamePascal} = JS_GetOpaque(val, js_${classNameSnake}_class_id);
  websg_dispose_${classNameSnake}(js${classNamePascal}->${classNameSnake});
  js_free_rt(rt, js${classNamePascal});
}

static JSClassDef js_${classNameSnake}_class = {
  "${classNamePascal}",
  .finalizer = js_${classNameSnake}_finalizer
};

static const JSCFunctionListEntry js_${classNameSnake}_proto_funcs[] = {
${Object.entries(resourceDef.schema)
  .map(([propName, propDef]) => generateJSPropFunctionListEntry(classNameSnake, propName, propDef))
  .filter((val) => !!val)
  .map((val) => `  ${val}`)
  .join("\n")}
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
  ${classNamePascal} *${classNameSnake} = websg_get_${classNameSnake}_by_name(name);
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
    JS${classNamePascal} *js${classNamePascal} = js_malloc(ctx, sizeof(JS${classNamePascal}));
    js${classNamePascal}->${classNameSnake} = ${classNameSnake};
    JS_SetOpaque(val, js${classNamePascal});
    set_js_val_from_ptr(ctx, ${classNameSnake}, val);
  }

  return val;
}

${classNamePascal} *get_${classNameSnake}_from_js_val(JSContext *ctx, JSValue val) {
  if (JS_IsUndefined(val) || JS_IsNull(val)) {
    return NULL;
  }

  JS${classNamePascal} *js${classNamePascal} = JS_GetOpaque2(ctx, val, js_${classNameSnake}_class_id);

  if (!js${classNamePascal}) {
    return NULL;
  }

  return js${classNamePascal}->${classNameSnake};
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
#include "websg.h";

JSValue create_${classNameSnake}_from_ptr(JSContext *ctx, ${classNamePascal} *${classNameSnake});

${classNamePascal} *get_${classNameSnake}_from_js_val(JSContext *ctx, JSValue ${classNameSnake});

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
