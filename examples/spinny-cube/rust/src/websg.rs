#[repr(C)]
pub struct Node {
  pub id: i32,
  pub name: Box<str>,
  pub position: [f32; 3],
  pub quaternion: [f32; 4],
  pub scale: [f32; 3],
  pub parent: Option<Box<Node>>,
  pub first_child: Option<Box<Node>>,
  pub next_sibling: Option<Box<Node>>,
  pub prev_sibling: Option<Box<Node>>,
}

pub fn create_node() -> Node {
  unsafe { _create_node() }
}

#[link(wasm_import_module = "wasgi")]
extern "C" {
  #[link_name = "create_node"]
  fn _create_node() -> Node;
}