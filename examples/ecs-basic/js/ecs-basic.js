const Spinner = world.findComponentStoreByName("Spinner");

const spinnerQuery = world.createQuery([Spinner]);

function setRotationAxis(quat, axis, angle) {
  // Ensure the axis is a unit vector
  let xAxis = axis[0];
  let yAxis = axis[1];
  let zAxis = axis[2];

  let len = xAxis * xAxis + yAxis * yAxis + zAxis * zAxis;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  xAxis = axis[0] * len;
  yAxis = axis[1] * len;
  zAxis = axis[2] * len;

  // Calculate the sin and cos values for half of the angle
  let halfAngle = angle / 2;
  let sinHalfAngle = Math.sin(halfAngle);
  let cosHalfAngle = Math.cos(halfAngle);

  // Compute the quaternion components
  quat.x = xAxis * sinHalfAngle;
  quat.y = yAxis * sinHalfAngle;
  quat.z = zAxis * sinHalfAngle;
  quat.w = cosHalfAngle;
}

function SpinnerSystem(time) {
  for (const node of spinnerQuery) {
    const spinner = node.getComponent(Spinner);
    setRotationAxis(node.rotation, spinner.axis, time * spinner.speed);
  }
}

world.onupdate = (dt, time) => {
  SpinnerSystem(time);
};
