// https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/ImprovedNoise.js
const _p = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21,
  10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149,
  56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229,
  122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209,
  76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
  226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
  223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
  108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179,
  162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50,
  45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

for (let i = 0; i < 256; i++) {
  _p[256 + i] = _p[i];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
  return a + t * (b - a);
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y,
    v = h < 4 ? y : h == 12 || h == 14 ? x : z;
  return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

function improvedNoise(x, y, z) {
  const floorX = Math.floor(x),
    floorY = Math.floor(y),
    floorZ = Math.floor(z);

  const X = floorX & 255,
    Y = floorY & 255,
    Z = floorZ & 255;

  x -= floorX;
  y -= floorY;
  z -= floorZ;

  const xMinus1 = x - 1,
    yMinus1 = y - 1,
    zMinus1 = z - 1;

  const u = fade(x),
    v = fade(y),
    w = fade(z);

  const A = _p[X] + Y,
    AA = _p[A] + Z,
    AB = _p[A + 1] + Z,
    B = _p[X + 1] + Y,
    BA = _p[B] + Z,
    BB = _p[B + 1] + Z;

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(_p[AA], x, y, z), grad(_p[BA], xMinus1, y, z)),
      lerp(u, grad(_p[AB], x, yMinus1, z), grad(_p[BB], xMinus1, yMinus1, z))
    ),
    lerp(
      v,
      lerp(u, grad(_p[AA + 1], x, y, zMinus1), grad(_p[BA + 1], xMinus1, y, zMinus1)),
      lerp(u, grad(_p[AB + 1], x, yMinus1, zMinus1), grad(_p[BB + 1], xMinus1, yMinus1, zMinus1))
    )
  );
}

// Adapted from https://github.com/dmnsgn/primitive-geometry/blob/main/src/ellipsoid.js

function generateSphereMesh(radius, widthSegments, heightSegments, theta, thetaOffset, phi, phiOffset) {
  const size = (widthSegments + 1) * (heightSegments + 1);

  const indicesCount = widthSegments * heightSegments * 6;
  const indices = new Uint16Array(indicesCount);

  const positionsCount = size;
  const positions = new Float32Array(positionsCount * 3);

  const normalsCount = size;
  const normals = new Float32Array(normalsCount * 3);

  const uvsCount = size;
  const uvs = new Float32Array(uvsCount * 2);

  const temp = new Float32Array(3);
  let vertexIndex = 0;
  let curIndex = 0;

  for (let iy = 0; iy <= heightSegments; iy++) {
    let v = iy / heightSegments;
    let t = v * theta + thetaOffset;
    let cosTheta = Math.cos(t);
    let sinTheta = Math.sin(t);

    for (let ix = 0; ix <= widthSegments; ix++) {
      let u = ix / widthSegments;
      let p = u * phi + phiOffset;
      let cosPhi = Math.cos(p);
      let sinPhi = Math.sin(p);

      temp[0] = -cosPhi * sinTheta;
      temp[1] = -cosTheta;
      temp[2] = sinPhi * sinTheta;

      positions[vertexIndex * 3] = radius * temp[0];
      positions[vertexIndex * 3 + 1] = radius * temp[1];
      positions[vertexIndex * 3 + 2] = radius * temp[2];

      let length = Math.sqrt(temp[0] * temp[0] + temp[1] * temp[1] + temp[2] * temp[2]);
      let n = 1 / length;
      normals[vertexIndex * 3] = temp[0] * n;
      normals[vertexIndex * 3 + 1] = temp[1] * n;
      normals[vertexIndex * 3 + 2] = temp[2] * n;

      uvs[vertexIndex * 2] = u;
      uvs[vertexIndex * 2 + 1] = v;

      vertexIndex++;
    }

    if (iy > 0) {
      for (let i = vertexIndex - 2 * (widthSegments + 1); i + widthSegments + 2 < vertexIndex; i++) {
        const a = i;
        const b = i + 1;
        const c = i + widthSegments + 1;
        const d = i + widthSegments + 2;
        indices[curIndex] = a;
        indices[curIndex + 1] = b;
        indices[curIndex + 2] = c;

        indices[curIndex + 3] = c;
        indices[curIndex + 4] = b;
        indices[curIndex + 5] = d;

        curIndex += 6;
      }
    }
  }

  const mesh = world.createMesh({
    primitives: [
      {
        mode: WebSG.MeshPrimitiveMode.TRIANGLES,
        indices: world.createAccessorFrom(indices.buffer, {
          componentType: WebSG.AccessorComponentType.Uint16,
          count: indicesCount,
          type: WebSG.AccessorType.SCALAR,
        }),
        attributes: {
          POSITION: world.createAccessorFrom(positions.buffer, {
            componentType: WebSG.AccessorComponentType.Float32,
            count: positionsCount,
            type: WebSG.AccessorType.VEC3,
            dynamic: true,
          }),
          NORMAL: world.createAccessorFrom(normals.buffer, {
            componentType: WebSG.AccessorComponentType.Float32,
            count: normalsCount,
            type: WebSG.AccessorType.VEC3,
            normalized: true,
            dynamic: true,
          }),
          TEXCOORD_0: world.createAccessorFrom(uvs.buffer, {
            componentType: WebSG.AccessorComponentType.Float32,
            count: uvsCount,
            type: WebSG.AccessorType.VEC2,
          }),
        },
      },
    ],
  });

  return {
    vertexCount: vertexIndex,
    positions,
    mesh,
  };
}

let audioData;
let vertexCount;
let sphereMeshData;
let positionAccessor;
let sphereNode;
let beamMaterial;
let accNoise = 0;

world.onload = () => {
  const meshMaterial = world.createMaterial({
    baseColorFactor: [0, 0, 0, 1],
    metallicFactor: 0.5,
    roughnessFactor: 0.7,
  });

  sphereMeshData = generateSphereMesh(1, 32, 16, Math.PI, 0, Math.PI * 2, 0);

  positionAccessor = sphereMeshData.mesh.primitives[0].getAttribute("POSITION");

  vertexCount = sphereMeshData.vertexCount;

  sphereMeshData.mesh.primitives[0].material = meshMaterial;

  sphereNode = world.createNode({
    translation: [7, 8, -17],
    scale: [3, 3, 3],
    mesh: sphereMeshData.mesh,
  });

  world.environment.addNode(sphereNode);

  const beamMesh = world.findMeshByName("Tube_Light_01");
  beamMaterial = beamMesh.primitives[0].material;
  beamMaterial.emissiveFactor[0] = 1;
  beamMaterial.emissiveFactor[1] = 1;
  beamMaterial.emissiveFactor[2] = 1;

  const audioDataSize = thirdroom.getAudioDataSize();
  audioData = new Uint8Array(audioDataSize);
};

world.onupdate = (dt, elapsed) => {
  thirdroom.getAudioFrequencyData(audioData);

  let lowFreqAvg = 0;

  for (let i = 0; i < 128; i++) {
    lowFreqAvg += audioData[i];
  }

  lowFreqAvg = lowFreqAvg / 128 / 255;

  for (let i = 0; i < vertexCount; i++) {
    let x = sphereMeshData.positions[i * 3];
    let y = sphereMeshData.positions[i * 3 + 1];
    let z = sphereMeshData.positions[i * 3 + 2];

    let length = Math.sqrt(x * x + y * y + z * z);
    let n = 1 / length;
    x = x * n;
    y = y * n;
    z = z * n;

    const noise = 1 + 0.5 * improvedNoise(x * 5 + elapsed, y * 5 + elapsed, z * 5 + elapsed);

    sphereMeshData.positions[i * 3] = x * noise;
    sphereMeshData.positions[i * 3 + 1] = y * noise;
    sphereMeshData.positions[i * 3 + 2] = z * noise;

    accNoise += noise;
  }

  let scale = 3 * (1 + lowFreqAvg);
  sphereNode.scale[0] = scale;
  sphereNode.scale[1] = scale;
  sphereNode.scale[2] = scale;

  beamMaterial.emissiveFactor[0] = 1;
  beamMaterial.emissiveFactor[1] = 1 - lowFreqAvg;
  beamMaterial.emissiveFactor[2] = 1 - lowFreqAvg;

  positionAccessor.updateWith(sphereMeshData.positions.buffer);
};
