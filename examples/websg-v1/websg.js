let verticalPlatform;
let horizontalPlatform;
let spinner;

function lerp(out, a, b, t) {
  let ax = a[0];
  let ay = a[1];
  let az = a[2];

  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);

  return out;
}

onload = () => {
  verticalPlatform = world.findNodeByName("VerticalPlatform");
  horizontalPlatform = world.findNodeByName("HorizontalPlatform");
  spinner = world.findNodeByName("Spinner");
};

const verticalPlatformStartPos = [-7.398, 2.866, 2.025];
const verticalPlatformEndPos = [-7.398, 0.246, 2.025];

const horizontalPlatformStartPos = [-11.56, 2.866, 2.025];
const horizontalPlatformEndPos = [-18.07, 2.866, 2.025];

onupdate = (dt, time) => {
  lerp(cube.position, verticalPlatformStartPos, verticalPlatformEndPos, Math.sin(time));
  cube.position[1] = Math.sin(time) + 2;
};
