import { deepStrictEqual, strictEqual } from "assert";

import {
  Transform,
  getLastChild,
  getChildAt,
  addChild,
  removeChild,
  traverse,
} from "../../../src/engine/component/transform";
import { NOOP } from "../../../src/engine/config";

describe("Transform Unit Tests", function () {
  describe("scene graph hierarchy", function () {
    describe("parenting", function () {
      describe("#getLastChild()", function () {
        it("should get last child of NOOP with no children", function () {
          const parent = 1;
          strictEqual(getLastChild(parent), NOOP);
        });
        it("should get last child of 1 children", function () {
          const parent = 1;
          const child = 2;
          Transform.firstChild[parent] = child;
          strictEqual(getLastChild(parent), child);
        });
        it("should get last child of 2 children", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          Transform.firstChild[parent] = childA;
          Transform.nextSibling[childA] = childB;
          strictEqual(getLastChild(parent), childB);
        });
      });

      describe("#getChildAt()", function () {
        it("should get child at index 0", function () {
          const parent = 1;
          const child = 2;
          Transform.firstChild[parent] = child;
          strictEqual(getChildAt(parent, 0), 2);
        });
        it("should get child at index 1", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          Transform.firstChild[parent] = childA;
          Transform.nextSibling[childA] = childB;
          strictEqual(getChildAt(parent, 1), 3);
        });
      });

      describe("#addChild()", function () {
        beforeEach(function () {
          Transform.firstChild.fill(0);
          Transform.prevSibling.fill(0);
          Transform.nextSibling.fill(0);
        });
        it("should add one child", function () {
          const parent = 1;
          const child = 2;
          addChild(parent, child);
          strictEqual(Transform.firstChild[parent], child);
        });
        it("should add multiple children", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          const childC = 4;
          addChild(parent, childA);
          addChild(parent, childB);
          addChild(parent, childC);

          strictEqual(Transform.firstChild[parent], childA);

          strictEqual(Transform.prevSibling[childA], NOOP);
          strictEqual(Transform.nextSibling[childA], childB);

          strictEqual(Transform.prevSibling[childB], childA);
          strictEqual(Transform.nextSibling[childB], childC);

          strictEqual(Transform.prevSibling[childC], childB);
          strictEqual(Transform.nextSibling[childC], NOOP);
        });
      });

      describe("#removeChild", function () {
        it("should remove one child", function () {
          const parent = 1;
          const child = 2;

          addChild(parent, child);

          strictEqual(Transform.firstChild[parent], child);

          removeChild(parent, child);

          strictEqual(Transform.firstChild[parent], NOOP);
        });
        it("should remove multiple children", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          const childC = 4;
          addChild(parent, childA);
          addChild(parent, childB);
          addChild(parent, childC);

          strictEqual(Transform.firstChild[parent], childA);

          strictEqual(Transform.prevSibling[childA], NOOP);
          strictEqual(Transform.nextSibling[childA], childB);

          strictEqual(Transform.prevSibling[childB], childA);
          strictEqual(Transform.nextSibling[childB], childC);

          strictEqual(Transform.prevSibling[childC], childB);
          strictEqual(Transform.nextSibling[childC], NOOP);

          removeChild(parent, childB);

          strictEqual(Transform.nextSibling[childB], NOOP);
          strictEqual(Transform.prevSibling[childB], NOOP);

          strictEqual(Transform.firstChild[parent], childA);

          strictEqual(Transform.prevSibling[childA], NOOP);
          strictEqual(Transform.nextSibling[childA], childC);
          strictEqual(Transform.prevSibling[childC], childA);
          strictEqual(Transform.nextSibling[childC], NOOP);

          removeChild(parent, childA);

          strictEqual(Transform.nextSibling[childA], NOOP);
          strictEqual(Transform.prevSibling[childA], NOOP);

          strictEqual(Transform.firstChild[parent], childC);

          strictEqual(Transform.prevSibling[childC], NOOP);
          strictEqual(Transform.nextSibling[childC], NOOP);
        });
      });
    });

    describe("matrix calculations", function () {
      describe("#updateMatrixWorld()", function () {});
      describe("#updateWorldMatrix()", function () {});
      describe("#composeMatrix()", function () {});
      describe("#updateMatrix()", function () {});
    });

    describe("traverse", () => {
      beforeEach(function () {
        Transform.firstChild.fill(0);
        Transform.prevSibling.fill(0);
        Transform.nextSibling.fill(0);
      });

      it("should traverse in depth first order", () => {
        /**
         *       root(1)
         *         / \
         *      A(2) B(3)
         *      /     / \
         *    E(6)  C(4) D(5)
         *    /
         *   F(7)
         */

        const root = 1;
        const childA = 2;
        const childB = 3;
        const childC = 4;
        const childD = 5;
        const childE = 6;
        const childF = 7;
        addChild(root, childA);
        addChild(root, childB);
        addChild(childB, childC);
        addChild(childB, childD);
        addChild(childA, childE);
        addChild(childE, childF);

        const result: number[] = [];

        traverse(1, (eid) => result.push(eid));

        deepStrictEqual(result, [1, 2, 6, 7, 3, 4, 5]);
      });
    });
  });
});
