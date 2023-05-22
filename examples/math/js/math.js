test("new WebSG.Vector2()", (expect) => {
  const a = new WebSG.Vector2();
  expect.equals(a.x, 0);
  expect.equals(a.y, 0);

  const b = new WebSG.Vector2(1, 2);
  expect.equals(b.x, 1);
  expect.equals(b.y, 2);

  const c = new WebSG.Vector2([3, 4]);
  expect.equals(c.x, 3);
  expect.equals(c.y, 4);

  const d = new WebSG.Vector2(new Float32Array([5, 6]));
  expect.equals(d.x, 5);
  expect.equals(d.y, 6);
});

test("WebSG.Vector2 getters/setters", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  expect.equals(a.x, 1);
  expect.equals(a.y, 2);

  expect.equals(a.width, 1);
  expect.equals(a.height, 2);

  expect.equals(a[0], 1);
  expect.equals(a[1], 2);

  expect.equals(a.length, 2);

  expect.equals(a.toString(), "1,2");
});

test("WebSG.Vector2.prototype.set()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  a.set([3, 4]);
  expect.equals(a.x, 3);
  expect.equals(a.y, 4);

  const b = new WebSG.Vector2(5, 6);
  b.set(new WebSG.Vector2(7, 8));
  expect.equals(b.x, 7);
  expect.equals(b.y, 8);
});

test("WebSG.Vector2.prototype.setScalar()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  a.setScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 3);
});

test("WebSG.Vector2.prototype.add()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  a.add(b);
  expect.equals(a.x, 4);
  expect.equals(a.y, 6);

  const c = new WebSG.Vector2(5, 6);
  c.add([7, 8]);
  expect.equals(c.x, 12);
  expect.equals(c.y, 14);
});

test("WebSG.Vector2.prototype.addVectors()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  const c = new WebSG.Vector2();
  c.addVectors(a, b);
  expect.equals(c.x, 4);
  expect.equals(c.y, 6);

  const d = new WebSG.Vector2();
  d.addVectors([5, 6], [7, 8]);
  expect.equals(d.x, 12);
  expect.equals(d.y, 14);
});

test("WebSG.Vector2.prototype.addScaledVector()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  a.addScaledVector(b, 10);
  expect.equals(a.x, 31);
  expect.equals(a.y, 42);

  const c = new WebSG.Vector2();
  c.addScaledVector([5, 6], 10);
  expect.equals(c.x, 50);
  expect.equals(c.y, 60);
});

test("WebSG.Vector2.prototype.subtract()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  a.subtract(b);
  expect.equals(a.x, -2);
  expect.equals(a.y, -2);

  const c = new WebSG.Vector2(5, 6);
  c.subtract([7, 8]);
  expect.equals(c.x, -2);
  expect.equals(c.y, -2);
});

test("WebSG.Vector2.prototype.subtractVectors()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  const c = new WebSG.Vector2();
  c.subtractVectors(a, b);
  expect.equals(c.x, -2);
  expect.equals(c.y, -2);

  const d = new WebSG.Vector2();
  d.subtractVectors([5, 6], [7, 8]);
  expect.equals(d.x, -2);
  expect.equals(d.y, -2);
});

test("WebSG.Vector2.prototype.subtractScaledVector()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  a.subtractScaledVector(b, 10);
  expect.equals(a.x, -29);
  expect.equals(a.y, -38);

  const c = new WebSG.Vector2();
  c.subtractScaledVector([5, 6], 10);
  expect.equals(c.x, -50);
  expect.equals(c.y, -60);
});

test("WebSG.Vector2.prototype.multiply()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  a.multiply(b);
  expect.equals(a.x, 3);
  expect.equals(a.y, 8);

  const c = new WebSG.Vector2(5, 6);
  c.multiply([7, 8]);
  expect.equals(c.x, 35);
  expect.equals(c.y, 48);
});

test("WebSG.Vector2.prototype.multiplyVectors()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  const b = new WebSG.Vector2(3, 4);
  const c = new WebSG.Vector2();
  c.multiplyVectors(a, b);
  expect.equals(c.x, 3);
  expect.equals(c.y, 8);

  const d = new WebSG.Vector2();
  d.multiplyVectors([5, 6], [7, 8]);
  expect.equals(d.x, 35);
  expect.equals(d.y, 48);
});

test("WebSG.Vector2.prototype.multiplyScalar()", (expect) => {
  const a = new WebSG.Vector2(1, 2);
  a.multiplyScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 6);
});

test("WebSG.Vector2.prototype.divide()", (expect) => {
  const a = new WebSG.Vector2(6, 8);
  const b = new WebSG.Vector2(2, 4);
  a.divide(b);
  expect.equals(a.x, 3);
  expect.equals(a.y, 2);

  const c = new WebSG.Vector2(10, 6);
  c.divide([2, 3]);
  expect.equals(c.x, 5);
  expect.equals(c.y, 2);
});

test("WebSG.Vector2.prototype.divideVectors()", (expect) => {
  const a = new WebSG.Vector2(3, 4);
  const b = new WebSG.Vector2(1, 2);
  const c = new WebSG.Vector2();
  c.divideVectors(a, b);
  expect.equals(c.x, 3);
  expect.equals(c.y, 2);

  const d = new WebSG.Vector2();
  d.divideVectors([10, 6], [5, 2]);
  expect.equals(d.x, 2);
  expect.equals(d.y, 3);
});

test("WebSG.Vector2.prototype.divideScalar()", (expect) => {
  const a = new WebSG.Vector2(9, 3);
  a.divideScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 1);
});

test("new WebSG.Vector3()", (expect) => {
  const a = new WebSG.Vector3();
  expect.equals(a.x, 0);
  expect.equals(a.y, 0);
  expect.equals(a.z, 0);

  const b = new WebSG.Vector3(1, 2, 3);
  expect.equals(b.x, 1);
  expect.equals(b.y, 2);
  expect.equals(b.z, 3);

  const c = new WebSG.Vector3([3, 4, 5]);
  expect.equals(c.x, 3);
  expect.equals(c.y, 4);
  expect.equals(c.z, 5);

  const d = new WebSG.Vector3(new Float32Array([5, 6, 7]));
  expect.equals(d.x, 5);
  expect.equals(d.y, 6);
  expect.equals(d.z, 7);
});

test("WebSG.Vector3 getters/setters", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  expect.equals(a.x, 1);
  expect.equals(a.y, 2);
  expect.equals(a.z, 3);

  expect.equals(a[0], 1);
  expect.equals(a[1], 2);
  expect.equals(a[2], 3);

  expect.equals(a.length, 3);

  expect.equals(a.toString(), "1,2,3");
});

test("WebSG.Vector3.prototype.set()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  a.set([3, 4, 5]);
  expect.equals(a.x, 3);
  expect.equals(a.y, 4);
  expect.equals(a.z, 5);

  const b = new WebSG.Vector3(5, 6, 7);
  b.set(new WebSG.Vector3(7, 8, 9));
  expect.equals(b.x, 7);
  expect.equals(b.y, 8);
  expect.equals(b.z, 9);
});

test("WebSG.Vector3.prototype.setScalar()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  a.setScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 3);
  expect.equals(a.z, 3);
});

test("WebSG.Vector3.prototype.add()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  a.add(b);
  expect.equals(a.x, 4);
  expect.equals(a.y, 6);
  expect.equals(a.z, 8);

  const c = new WebSG.Vector3(5, 6, 7);
  c.add([7, 8, 9]);
  expect.equals(c.x, 12);
  expect.equals(c.y, 14);
  expect.equals(c.z, 16);
});

test("WebSG.Vector3.prototype.addVectors()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  const c = new WebSG.Vector3();
  c.addVectors(a, b);
  expect.equals(c.x, 4);
  expect.equals(c.y, 6);
  expect.equals(c.z, 8);

  const d = new WebSG.Vector3();
  d.addVectors([5, 6, 7], [7, 8, 9]);
  expect.equals(d.x, 12);
  expect.equals(d.y, 14);
  expect.equals(d.z, 16);
});

test("WebSG.Vector3.prototype.addScaledVector()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  a.addScaledVector(b, 10);
  expect.equals(a.x, 31);
  expect.equals(a.y, 42);
  expect.equals(a.z, 53);

  const c = new WebSG.Vector3();
  c.addScaledVector([5, 6, 7], 10);
  expect.equals(c.x, 50);
  expect.equals(c.y, 60);
  expect.equals(c.z, 70);
});

test("WebSG.Vector3.prototype.subtract()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  a.subtract(b);
  expect.equals(a.x, -2);
  expect.equals(a.y, -2);
  expect.equals(a.z, -2);

  const c = new WebSG.Vector3(5, 6, 7);
  c.subtract([7, 8, 9]);
  expect.equals(c.x, -2);
  expect.equals(c.y, -2);
  expect.equals(c.z, -2);
});

test("WebSG.Vector3.prototype.subtractVectors()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  const c = new WebSG.Vector3();
  c.subtractVectors(a, b);
  expect.equals(c.x, -2);
  expect.equals(c.y, -2);
  expect.equals(c.z, -2);

  const d = new WebSG.Vector3();
  d.subtractVectors([5, 6, 7], [7, 8, 9]);
  expect.equals(d.x, -2);
  expect.equals(d.y, -2);
  expect.equals(d.z, -2);
});

test("WebSG.Vector3.prototype.subtractScaledVector()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  a.subtractScaledVector(b, 10);
  expect.equals(a.x, -29);
  expect.equals(a.y, -38);
  expect.equals(a.z, -47);

  const c = new WebSG.Vector3();
  c.subtractScaledVector([5, 6, 7], 10);
  expect.equals(c.x, -50);
  expect.equals(c.y, -60);
  expect.equals(c.z, -70);
});

test("WebSG.Vector3.prototype.multiply()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  a.multiply(b);
  expect.equals(a.x, 3);
  expect.equals(a.y, 8);
  expect.equals(a.z, 15);

  const c = new WebSG.Vector3(5, 6, 7);
  c.multiply([7, 8, 9]);
  expect.equals(c.x, 35);
  expect.equals(c.y, 48);
  expect.equals(c.z, 63);
});

test("WebSG.Vector3.prototype.multiplyVectors()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  const b = new WebSG.Vector3(3, 4, 5);
  const c = new WebSG.Vector3();
  c.multiplyVectors(a, b);
  expect.equals(c.x, 3);
  expect.equals(c.y, 8);
  expect.equals(c.z, 15);

  const d = new WebSG.Vector3();
  d.multiplyVectors([5, 6, 7], [7, 8, 9]);
  expect.equals(d.x, 35);
  expect.equals(d.y, 48);
  expect.equals(d.z, 63);
});

test("WebSG.Vector3.prototype.multiplyScalar()", (expect) => {
  const a = new WebSG.Vector3(1, 2, 3);
  a.multiplyScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 6);
  expect.equals(a.z, 9);
});

test("WebSG.Vector3.prototype.divide()", (expect) => {
  const a = new WebSG.Vector3(6, 8, 9);
  const b = new WebSG.Vector3(2, 4, 3);
  a.divide(b);
  expect.equals(a.x, 3);
  expect.equals(a.y, 2);
  expect.equals(a.z, 3);

  const c = new WebSG.Vector3(10, 6, 4);
  c.divide([2, 3, 4]);
  expect.equals(c.x, 5);
  expect.equals(c.y, 2);
  expect.equals(c.z, 1);
});

test("WebSG.Vector3.prototype.divideVectors()", (expect) => {
  const a = new WebSG.Vector3(3, 4, 5);
  const b = new WebSG.Vector3(1, 2, 5);
  const c = new WebSG.Vector3();
  c.divideVectors(a, b);
  expect.equals(c.x, 3);
  expect.equals(c.y, 2);
  expect.equals(c.z, 1);

  const d = new WebSG.Vector3();
  d.divideVectors([10, 6, 9], [5, 2, 3]);
  expect.equals(d.x, 2);
  expect.equals(d.y, 3);
  expect.equals(d.z, 3);
});

test("WebSG.Vector3.prototype.divideScalar()", (expect) => {
  const a = new WebSG.Vector3(9, 3, 6);
  a.divideScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 1);
  expect.equals(a.z, 2);
});

test("new WebSG.Vector4()", (expect) => {
  const a = new WebSG.Vector4();
  expect.equals(a.x, 0);
  expect.equals(a.y, 0);
  expect.equals(a.z, 0);
  expect.equals(a.w, 0);

  const b = new WebSG.Vector4(1, 2, 3, 4);
  expect.equals(b.x, 1);
  expect.equals(b.y, 2);
  expect.equals(b.z, 3);
  expect.equals(b.w, 4);

  const c = new WebSG.Vector4([3, 4, 5, 6]);
  expect.equals(c.x, 3);
  expect.equals(c.y, 4);
  expect.equals(c.z, 5);
  expect.equals(c.w, 6);

  const d = new WebSG.Vector4(new Float32Array([5, 6, 7, 8]));
  expect.equals(d.x, 5);
  expect.equals(d.y, 6);
  expect.equals(d.z, 7);
  expect.equals(d.w, 8);
});

test("WebSG.Vector4 getters/setters", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  expect.equals(a.x, 1);
  expect.equals(a.y, 2);
  expect.equals(a.z, 3);
  expect.equals(a.w, 4);

  expect.equals(a.top, 1);
  expect.equals(a.right, 2);
  expect.equals(a.bottom, 3);
  expect.equals(a.left, 4);

  expect.equals(a[0], 1);
  expect.equals(a[1], 2);
  expect.equals(a[2], 3);
  expect.equals(a[3], 4);

  expect.equals(a.length, 4);

  expect.equals(a.toString(), "1,2,3,4");
});

test("WebSG.Vector4.prototype.set()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  a.set([3, 4, 5, 6]);
  expect.equals(a.x, 3);
  expect.equals(a.y, 4);
  expect.equals(a.z, 5);
  expect.equals(a.w, 6);

  const b = new WebSG.Vector4(5, 6, 7, 8);
  b.set(new WebSG.Vector4(7, 8, 9, 10));
  expect.equals(b.x, 7);
  expect.equals(b.y, 8);
  expect.equals(b.z, 9);
  expect.equals(b.w, 10);
});

test("WebSG.Vector4.prototype.setScalar()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  a.setScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 3);
  expect.equals(a.z, 3);
  expect.equals(a.w, 3);
});

test("WebSG.Vector4.prototype.add()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  a.add(b);
  expect.equals(a.x, 4);
  expect.equals(a.y, 6);
  expect.equals(a.z, 8);
  expect.equals(a.w, 10);

  const c = new WebSG.Vector4(5, 6, 7, 8);
  c.add([7, 8, 9, 10]);
  expect.equals(c.x, 12);
  expect.equals(c.y, 14);
  expect.equals(c.z, 16);
  expect.equals(c.w, 18);
});

test("WebSG.Vector4.prototype.addVectors()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  const c = new WebSG.Vector4();
  c.addVectors(a, b);
  expect.equals(c.x, 4);
  expect.equals(c.y, 6);
  expect.equals(c.z, 8);
  expect.equals(c.w, 10);

  const d = new WebSG.Vector4();
  d.addVectors([5, 6, 7, 8], [7, 8, 9, 10]);
  expect.equals(d.x, 12);
  expect.equals(d.y, 14);
  expect.equals(d.z, 16);
  expect.equals(d.w, 18);
});

test("WebSG.Vector4.prototype.addScaledVector()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  a.addScaledVector(b, 10);
  expect.equals(a.x, 31);
  expect.equals(a.y, 42);
  expect.equals(a.z, 53);
  expect.equals(a.w, 64);

  const c = new WebSG.Vector4();
  c.addScaledVector([5, 6, 7, 8], 10);
  expect.equals(c.x, 50);
  expect.equals(c.y, 60);
  expect.equals(c.z, 70);
  expect.equals(c.w, 80);
});

test("WebSG.Vector4.prototype.subtract()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  a.subtract(b);
  expect.equals(a.x, -2);
  expect.equals(a.y, -2);
  expect.equals(a.z, -2);
  expect.equals(a.w, -2);

  const c = new WebSG.Vector4(5, 6, 7, 8);
  c.subtract([7, 8, 9, 10]);
  expect.equals(c.x, -2);
  expect.equals(c.y, -2);
  expect.equals(c.z, -2);
  expect.equals(c.w, -2);
});

test("WebSG.Vector4.prototype.subtractVectors()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  const c = new WebSG.Vector4();
  c.subtractVectors(a, b);
  expect.equals(c.x, -2);
  expect.equals(c.y, -2);
  expect.equals(c.z, -2);
  expect.equals(c.w, -2);

  const d = new WebSG.Vector4();
  d.subtractVectors([5, 6, 7, 8], [7, 8, 9, 10]);
  expect.equals(d.x, -2);
  expect.equals(d.y, -2);
  expect.equals(d.z, -2);
  expect.equals(d.w, -2);
});

test("WebSG.Vector4.prototype.subtractScaledVector()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  a.subtractScaledVector(b, 10);
  expect.equals(a.x, -29);
  expect.equals(a.y, -38);
  expect.equals(a.z, -47);
  expect.equals(a.w, -56);

  const c = new WebSG.Vector4();
  c.subtractScaledVector([5, 6, 7, 8], 10);
  expect.equals(c.x, -50);
  expect.equals(c.y, -60);
  expect.equals(c.z, -70);
  expect.equals(c.w, -80);
});

test("WebSG.Vector4.prototype.multiply()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  a.multiply(b);
  expect.equals(a.x, 3);
  expect.equals(a.y, 8);
  expect.equals(a.z, 15);
  expect.equals(a.w, 24);

  const c = new WebSG.Vector4(5, 6, 7, 8);
  c.multiply([7, 8, 9, 10]);
  expect.equals(c.x, 35);
  expect.equals(c.y, 48);
  expect.equals(c.z, 63);
  expect.equals(c.w, 80);
});

test("WebSG.Vector4.prototype.multiplyVectors()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  const b = new WebSG.Vector4(3, 4, 5, 6);
  const c = new WebSG.Vector4();
  c.multiplyVectors(a, b);
  expect.equals(c.x, 3);
  expect.equals(c.y, 8);
  expect.equals(c.z, 15);
  expect.equals(c.w, 24);

  const d = new WebSG.Vector4();
  d.multiplyVectors([5, 6, 7, 8], [7, 8, 9, 10]);
  expect.equals(d.x, 35);
  expect.equals(d.y, 48);
  expect.equals(d.z, 63);
  expect.equals(d.w, 80);
});

test("WebSG.Vector4.prototype.multiplyScalar()", (expect) => {
  const a = new WebSG.Vector4(1, 2, 3, 4);
  a.multiplyScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 6);
  expect.equals(a.z, 9);
  expect.equals(a.w, 12);
});

test("WebSG.Vector4.prototype.divide()", (expect) => {
  const a = new WebSG.Vector4(6, 8, 9, 10);
  const b = new WebSG.Vector4(2, 4, 3, 5);
  a.divide(b);
  expect.equals(a.x, 3);
  expect.equals(a.y, 2);
  expect.equals(a.z, 3);
  expect.equals(a.w, 2);

  const c = new WebSG.Vector4(10, 6, 4, 15);
  c.divide([2, 3, 4, 5]);
  expect.equals(c.x, 5);
  expect.equals(c.y, 2);
  expect.equals(c.z, 1);
  expect.equals(c.w, 3);
});

test("WebSG.Vector4.prototype.divideVectors()", (expect) => {
  const a = new WebSG.Vector4(3, 4, 5, 10);
  const b = new WebSG.Vector4(1, 2, 5, 2);
  const c = new WebSG.Vector4();
  c.divideVectors(a, b);
  expect.equals(c.x, 3);
  expect.equals(c.y, 2);
  expect.equals(c.z, 1);
  expect.equals(c.w, 5);

  const d = new WebSG.Vector4();
  d.divideVectors([10, 6, 9, 20], [5, 2, 3, 5]);
  expect.equals(d.x, 2);
  expect.equals(d.y, 3);
  expect.equals(d.z, 3);
  expect.equals(d.w, 4);
});

test("WebSG.Vector4.prototype.divideScalar()", (expect) => {
  const a = new WebSG.Vector4(9, 3, 6, 12);
  a.divideScalar(3);
  expect.equals(a.x, 3);
  expect.equals(a.y, 1);
  expect.equals(a.z, 2);
  expect.equals(a.w, 4);
});

function test(description, testFn) {
  const expect = {
    equals(actual, expected) {
      if (expected !== actual) {
        throw new Error(`Expected: ${expected} Actual: ${actual}`);
      }
    },
  };

  try {
    testFn(expect);
    console.log(`test ${description}: Passed!`);
  } catch (error) {
    console.error(`test ${description}: Failed!\n${error}\n${error.stack}`);
  }
}
