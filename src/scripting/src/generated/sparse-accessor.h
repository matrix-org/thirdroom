
#ifndef __sparse_accessor_h
#define __sparse_accessor_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_sparse_accessor_class_id;

JSValue create_sparse_accessor_from_ptr(JSContext *ctx, SparseAccessor *sparse_accessor);

void js_define_sparse_accessor_api(JSContext *ctx, JSValue *target);

#endif