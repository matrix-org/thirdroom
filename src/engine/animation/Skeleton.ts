import {
  DataTexture,
  Matrix4,
  SkinnedMesh as ThreeSkinnedMesh,
  Skeleton as ThreeSkeleton,
  MathUtils,
  RGBAFormat,
  FloatType,
  Vector3,
  Vector4,
} from "three";

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();

export class Skeleton extends ThreeSkeleton {
  // frame: number;
  // update(): void;
  // boneTexture: DataTexture;
  // boneTextureSize: number;
  // skinnedMesh: SkinnedMesh;
  // bindMatrix: Matrix4;
  // bindMatrixInverse: Matrix4;
  // constructor(bones: Bone[], inverses: Matrix4[]) {}

  init() {
    console.log("skeleton.init()");
    return super.init();
  }

  calculateInverses() {
    console.log("skeleton.calculateInverses()");
    return super.calculateInverses();
  }

  pose() {
    console.log("skeleton.pose()");
    // return super.pose();

    // recover the bind-time world matrices

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone) {
        bone.matrixWorld.copy(this.boneInverses[i]); //.invert();
      }
    }

    // compute the local matrices, positions, rotations and scales

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone) {
        if (bone.parent && bone.parent.isBone) {
          bone.matrix.copy(bone.parent.matrixWorld); //.invert();
          bone.matrix.multiply(bone.matrixWorld);
        } else {
          bone.matrix.copy(bone.matrixWorld);
        }

        bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
      }
    }
  }

  update() {
    // console.log("skeleton.update()");
    // return super.update();

    const bones = this.bones;
    const boneInverses = this.boneInverses;
    const boneMatrices = this.boneMatrices;
    const boneTexture = this.boneTexture;

    // flatten bone matrices to array

    for (let i = 0, il = bones.length; i < il; i++) {
      // compute the offset between the current and the original transform

      const boneMatrix = bones[i] ? bones[i].matrixWorld : _identityMatrix;
      const boneInverseMatrix = boneInverses[i];

      _offsetMatrix.multiplyMatrices(boneMatrix, boneInverseMatrix);
      _offsetMatrix.toArray(boneMatrices, i * 16);
    }

    if (boneTexture !== null) {
      boneTexture.needsUpdate = true;
    }
  }

  clone() {
    console.log("skeleton.clone()");
    return super.clone();
  }

  computeBoneTexture() {
    console.log("skeleton.computeBoneTexture()");
    // return super.computeBoneTexture();

    // layout (1 matrix = 4 pixels)
    //      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
    //  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 * 8)
    //       16x16 pixel texture max   64 bones * 4 pixels = (16 * 16)
    //       32x32 pixel texture max  256 bones * 4 pixels = (32 * 32)
    //       64x64 pixel texture max 1024 bones * 4 pixels = (64 * 64)

    let size = Math.sqrt(this.bones.length * 4); // 4 pixels needed for 1 matrix
    size = MathUtils.ceilPowerOfTwo(size);
    size = Math.max(size, 4);

    const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    boneMatrices.set(this.boneMatrices); // copy current values

    const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
    boneTexture.needsUpdate = true;

    this.boneMatrices = boneMatrices;
    this.boneTexture = boneTexture;
    this.boneTextureSize = size;

    return this;
  }

  getBoneByName(name) {
    console.log("skeleton.getBoneByName()");
    return super.getBoneByName(name);
  }

  dispose() {
    console.log("skeleton.dispose()");
    return super.dispose();
  }
}

const _basePosition = /*@__PURE__*/ new Vector3();

const _skinIndex = /*@__PURE__*/ new Vector4();
const _skinWeight = /*@__PURE__*/ new Vector4();

const _vector = /*@__PURE__*/ new Vector3();
const _matrix = /*@__PURE__*/ new Matrix4();

export class SkinnedMesh extends ThreeSkinnedMesh {
  constructor(geometry, material) {
    super(geometry, material);

    this.isSkinnedMesh = true;

    this.type = "SkinnedMesh";

    this.bindMode = "attached";
    this.bindMatrix = new Matrix4();
    this.bindMatrixInverse = new Matrix4();
  }
  copy(source, recursive) {
    super.copy(source, recursive);

    this.bindMode = source.bindMode;
    this.bindMatrix.copy(source.bindMatrix);
    this.bindMatrixInverse.copy(source.bindMatrixInverse);

    this.skeleton = source.skeleton;

    return this;
  }

  bind(skeleton, bindMatrix) {
    this.skeleton = skeleton;

    if (bindMatrix === undefined) {
      this.updateMatrixWorld(true);

      this.skeleton.calculateInverses();

      bindMatrix = this.matrixWorld;
    }

    this.bindMatrix.copy(bindMatrix);
    this.bindMatrixInverse.copy(bindMatrix); //.invert();
  }

  pose() {
    this.skeleton.pose();
  }

  normalizeSkinWeights() {
    const vector = new Vector4();

    const skinWeight = this.geometry.attributes.skinWeight;

    for (let i = 0, l = skinWeight.count; i < l; i++) {
      vector.fromBufferAttribute(skinWeight, i);

      const scale = 1.0 / vector.manhattanLength();

      if (scale !== Infinity) {
        vector.multiplyScalar(scale);
      } else {
        vector.set(1, 0, 0, 0); // do something reasonable
      }

      skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
    }
  }

  updateMatrixWorld(force) {
    // super.updateMatrixWorld(force);

    if (this.bindMode === "attached") {
      // this.bindMatrixInverse.copy(this.matrixWorld).invert();
    } else if (this.bindMode === "detached") {
      // this.bindMatrixInverse.copy(this.bindMatrix).invert();
    } else {
      console.warn("SkinnedMesh: Unrecognized bindMode: " + this.bindMode);
    }
  }

  boneTransform(index, target) {
    const skeleton = this.skeleton;
    const geometry = this.geometry;

    _skinIndex.fromBufferAttribute(geometry.attributes.skinIndex, index);
    _skinWeight.fromBufferAttribute(geometry.attributes.skinWeight, index);

    _basePosition.copy(target).applyMatrix4(this.bindMatrix);

    target.set(0, 0, 0);

    for (let i = 0; i < 4; i++) {
      const weight = _skinWeight.getComponent(i);

      if (weight !== 0) {
        const boneIndex = _skinIndex.getComponent(i);

        _matrix.multiplyMatrices(skeleton.bones[boneIndex].matrixWorld, skeleton.boneInverses[boneIndex]);

        target.addScaledVector(_vector.copy(_basePosition).applyMatrix4(_matrix), weight);
      }
    }

    return target.applyMatrix4(this.bindMatrixInverse);
  }
}
