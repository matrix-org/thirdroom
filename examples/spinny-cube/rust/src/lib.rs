extern crate wee_alloc;
mod websg;
use websg::*;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[no_mangle]
fn initialize() {
  let mut node = create_node();
  node.position[1] = 1.6;
}

#[no_mangle]
fn update() {

}