import { rotateY } from "gl-matrix/quat";

const node = new WebSG.Node();

node.position[1] = 1.6;

onupdate = (dt) => {
  rotateY(node.quaternion, node.quaternion, dt * 0.5);
};
