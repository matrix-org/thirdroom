function lerp(out, a, b, t) {
  let ax = a[0];
  let ay = a[1];
  let az = a[2];

  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);

  return out;
}

function fromEuler(out, x, y, z) {
  let halfToRad = Math.PI / 360;
  x *= halfToRad;
  z *= halfToRad;
  y *= halfToRad;

  let sx = Math.sin(x);
  let cx = Math.cos(x);
  let sy = Math.sin(y);
  let cy = Math.cos(y);
  let sz = Math.sin(z);
  let cz = Math.cos(z);

  out[0] = sx * cy * cz + cx * sy * sz;
  out[1] = cx * sy * cz - sx * cy * sz;
  out[2] = cx * cy * sz + sx * sy * cz;
  out[3] = cx * cy * cz - sx * sy * sz;

  return out;
}

let verticalPlatform;
let horizontalPlatform;
let spinner;

world.onload = () => {
  verticalPlatform = world.findNodeByName("VerticalPlatform");
  horizontalPlatform = world.findNodeByName("HorizontalPlatform");
  spinner = world.findNodeByName("Spinner");

  const canvasNode = world.createNode({
    name: "Canvas",
    translation: [0, 1, 0],
  });

  const root = world.createUIElement({
    backgroundColor: [0, 0, 0, 1],
    borderRadius: [64, 64, 64, 64],
    borderWidth: [3, 3, 3, 3],
    borderColor: [1, 1, 1, 1],
  });

  canvasNode.uiCanvas = world.createUICanvas({
    root,
    size: [1, 1],
    width: 1024,
    height: 1024,
  });

  world.environment.addNode(canvasNode);
};

const verticalPlatformStartPos = [7.398, 2.866, 2.025];
const verticalPlatformEndPos = [7.398, 0.246, 2.025];

const horizontalPlatformStartPos = [11.56, 2.866, 2.025];
const horizontalPlatformEndPos = [18.07, 2.866, 2.025];

world.onupdate = (dt, time) => {
  const t = (Math.sin(time) + 1) / 2;
  lerp(verticalPlatform.translation, verticalPlatformStartPos, verticalPlatformEndPos, t);
  lerp(horizontalPlatform.translation, horizontalPlatformStartPos, horizontalPlatformEndPos, t);
  fromEuler(spinner.rotation, 90, 0, 30 * time);
};
