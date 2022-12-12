#include "./generated/websg.h"

// int scene_remove_node(Scene *scene, Node *node) {
//   if (!scene || !node) {
//     return -1;
//   }

//   if (scene->first_node == node) {
//     scene->first_node = 0;
//   }

//   Node *prev_sibling = node->prev_sibling;
//   Node *next_sibling = node->next_sibling;
  
//   // [prev, child, next]
//   if (prev_sibling && next_sibling) {
//     prev_sibling->next_sibling = next_sibling;
//     next_sibling->prev_sibling = prev_sibling;
//   }

//   // [prev, child]
//   if (prev_sibling && !next_sibling) {
//     prev_sibling->next_sibling = 0;
//   }

//   // [child, next]
//   if (next_sibling && !prev_sibling) {
//     next_sibling->prev_sibling = 0;
//     scene->first_node = next_sibling;
//   }

//   node->parent_scene = 0;
//   node->parent = 0;
//   node->next_sibling = 0;
//   node->prev_sibling = 0;

//   return 0;
// }

// int node_remove_child(Node *parent, Node *child) {
//   if (!parent || !child) {
//     return -1;
//   }

//   Node *prev_sibling = child->prev_sibling;
//   Node *next_sibling = child->next_sibling;

//   Node *first_child = parent->first_child;

//   if (first_child == child) {
//     parent->first_child = 0;
//   }
  
//   // [prev, child, next]
//   if (prev_sibling && next_sibling) {
//     prev_sibling->next_sibling = next_sibling;
//     next_sibling->prev_sibling = prev_sibling;
//   }

//   // [prev, child]
//   if (prev_sibling && !next_sibling) {
//     prev_sibling->next_sibling = 0;
//   }

//   // [child, next]
//   if (next_sibling && !prev_sibling) {
//     next_sibling->prev_sibling = 0;
//     parent->first_child = next_sibling;
//   }

//   child->parent_scene = 0;
//   child->parent = 0;
//   child->next_sibling = 0;
//   child->prev_sibling = 0;

//   return 0;
// }

// int scene_add_node_before(Scene *scene, Node *before, Node *node) {
//   if (!scene || !before || !node || before->parent_scene != scene) {
//     return -1;
//   }

//   if (node->parent) {
//     node_remove_child(node->parent, node);
//   } else if (node->parent_scene) {
//     scene_remove_node(node->parent_scene, node);
//   }

//   if (before->prev_sibling) {
//     before->prev_sibling->next_sibling = node;
//   } else {
//     scene->first_node = node;
//   }

//   before->prev_sibling = node;
//   node->next_sibling = before;
//   node->parent_scene = scene;

//   return 0;
// }

// int node_add_child_before(Node *parent, Node *before, Node *child) {
//   if (!before || !parent || !child || before->parent != parent) {
//     return -1;
//   }

//   if (child->parent) {
//     node_remove_child(child->parent, child);
//   } else if (child->parent_scene) {
//     scene_remove_node(child->parent_scene, child);
//   }

//   if (before->prev_sibling) {
//     before->prev_sibling->next_sibling = child;
//   } else {
//     parent->first_child = child;
//   }

//   before->prev_sibling = child;
//   child->next_sibling = before;
//   child->parent = parent;

//   return 0;
// }

// Node *scene_get_last_node(Scene *scene) {
//   Node *cur = scene->first_node;
//   Node *last = cur;

//   while (cur) {
//     last = cur;
//     cur = cur->next_sibling;
//   }

//   return last;
// }

// Node *node_get_last_child(Node *node) {
//   Node *cur = node->first_child;
//   Node *last = cur;

//   while (cur) {
//     last = cur;
//     cur = cur->next_sibling;
//   }

//   return last;
// }

// int scene_append_node(Scene *scene, Node *node) {
//   if (!scene || !node) {
//     return -1;
//   }

//   if (node->parent) {
//     node_remove_child(node->parent, node);
//   } else if (node->parent_scene) {
//     scene_remove_node(node->parent_scene, node);
//   }

//   node->parent_scene = scene;

//   Node *last_node = scene_get_last_node(scene);

//   if (last_node) {
//     last_node->next_sibling = node;
//     node->prev_sibling = last_node;
//     node->next_sibling = 0;
//   } else {
//     scene->first_node = node;
//     node->prev_sibling = 0;
//     node->next_sibling = 0;
//   }

//   return 0;
// }

// int node_append_child(Node *parent, Node *child) {
//   if (!parent || !child) {
//     return -1;
//   }

//   if (child->parent) {
//     node_remove_child(child->parent, child);
//   } else if (child->parent_scene) {
//     scene_remove_node(child->parent_scene, child);
//   }

//   child->parent = parent;

//   Node *last_child = node_get_last_child(parent);

//   if (last_child) {
//     last_child->next_sibling = child;
//     child->prev_sibling = last_child;
//     child->next_sibling = 0;
//   } else {
//     parent->first_child = child;
//     child->prev_sibling = 0;
//     child->next_sibling = 0;
//   }

//   return 0;
// }
