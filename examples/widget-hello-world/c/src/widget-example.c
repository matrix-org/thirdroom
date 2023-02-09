#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/engine/scripting/emscripten/src/generated/websg.h"
#include "../../../../src/engine/scripting/emscripten/src/matrix.h"

export void *websg_allocate(int size) {
  return malloc(size);
}

export void websg_deallocate(void *ptr) {
  free(ptr);
}

export void websg_entered() {
  matrix_send_widget_message(
    "{ \"api\": \"fromWidget\", \"requestId\": \"0\", \"widgetId\": \"test\", \"action\": \"content_loaded\", \"data\": {} }"
  );

  matrix_send_widget_message(
    "{ \"api\": \"fromWidget\", \"requestId\": \"1\", \"widgetId\": \"test\", \"action\": \"send_event\", \"data\": { \"type\": \"m.room.message\", \"content\": { \"msgtype\": \"m.text\", \"body\": \"Hello World\" } } }"
  );
}
