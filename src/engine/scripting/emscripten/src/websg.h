#ifndef __websg_h
#define __websg_h

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

#endif
