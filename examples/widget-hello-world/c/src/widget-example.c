#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/engine/scripting/emscripten/src/websg.h"
#include "../../../../src/engine/scripting/emscripten/src/matrix.h"

export void websg_enter() {
  const char *loaded_event = "{ \"api\": \"fromWidget\", \"requestId\": \"0\", \"widgetId\": \"test\", \"action\": \"content_loaded\", \"data\": {} }";
  matrix_send(loaded_event, strlen(loaded_event));

  const char *message_event = "{ \"api\": \"fromWidget\", \"requestId\": \"1\", \"widgetId\": \"test\", \"action\": \"send_event\", \"data\": { \"type\": \"m.room.message\", \"content\": { \"msgtype\": \"m.text\", \"body\": \"Hello World\" } } }";
  matrix_send(message_event, strlen(message_event));
}
