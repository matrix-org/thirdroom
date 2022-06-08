import { describe, test, expect, beforeEach } from "vitest";

import {
  Transform,
  getLastChild,
  getChildAt,
  addChild,
  removeChild,
  traverse,
} from "../../../src/engine/component/transform";
import { NOOP } from "../../../src/engine/config.common";

describe("Transform Unit Tests", function () {
  describe("scene graph hierarchy", function () {
    describe("parenting", function () {
      describe("#getLastChild()", function () {
        test("should get last child of NOOP with no children", function () {
          const parent = 1;
          expect(getLastChild(parent)).toStrictEqual(NOOP);
        });
        test("should get last child of 1 children", function () {
          const parent = 1;
          const child = 2;
          Transform.firstChild[parent] = child;
          expect(getLastChild(parent)).toStrictEqual(child);
        });
        test("should get last child of 2 children", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          Transform.firstChild[parent] = childA;
          Transform.nextSibling[childA] = childB;
          expect(getLastChild(parent)).toStrictEqual(childB);
        });
      });

      describe("#getChildAt()", function () {
        test("should get child at index 0", function () {
          const parent = 1;
          const child = 2;
          Transform.firstChild[parent] = child;
          expect(getChildAt(parent, 0)).toStrictEqual(2);
        });
        test("should get child at index 1", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          Transform.firstChild[parent] = childA;
          Transform.nextSibling[childA] = childB;
          expect(getChildAt(parent, 1)).toStrictEqual(3);
        });
      });

      describe("#addChild()", function () {
        beforeEach(function () {
          Transform.firstChild.fill(0);
          Transform.prevSibling.fill(0);
          Transform.nextSibling.fill(0);
        });
        test("should add one child", function () {
          const parent = 1;
          const child = 2;
          addChild(parent, child);
          expect(Transform.firstChild[parent]).toStrictEqual(child);
        });
        test("should add multiple children", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          const childC = 4;
          addChild(parent, childA);
          addChild(parent, childB);
          addChild(parent, childC);

          expect(Transform.firstChild[parent]).toStrictEqual(childA);

          expect(Transform.prevSibling[childA]).toStrictEqual(NOOP);
          expect(Transform.nextSibling[childA]).toStrictEqual(childB);

          expect(Transform.prevSibling[childB]).toStrictEqual(childA);
          expect(Transform.nextSibling[childB]).toStrictEqual(childC);

          expect(Transform.prevSibling[childC]).toStrictEqual(childB);
          expect(Transform.nextSibling[childC]).toStrictEqual(NOOP);
        });
      });

      describe("#removeChild", function () {
        test("should remove one child", function () {
          const parent = 1;
          const child = 2;

          addChild(parent, child);

          expect(Transform.firstChild[parent]).toStrictEqual(child);

          removeChild(parent, child);

          expect(Transform.firstChild[parent]).toStrictEqual(NOOP);
        });
        test("should remove multiple children", function () {
          const parent = 1;
          const childA = 2;
          const childB = 3;
          const childC = 4;
          addChild(parent, childA);
          addChild(parent, childB);
          addChild(parent, childC);

          expect(Transform.firstChild[parent]).toStrictEqual(childA);

          expect(Transform.prevSibling[childA]).toStrictEqual(NOOP);
          expect(Transform.nextSibling[childA]).toStrictEqual(childB);

          expect(Transform.prevSibling[childB]).toStrictEqual(childA);
          expect(Transform.nextSibling[childB]).toStrictEqual(childC);

          expect(Transform.prevSibling[childC]).toStrictEqual(childB);
          expect(Transform.nextSibling[childC]).toStrictEqual(NOOP);

          removeChild(parent, childB);

          expect(Transform.nextSibling[childB]).toStrictEqual(NOOP);
          expect(Transform.prevSibling[childB]).toStrictEqual(NOOP);

          expect(Transform.firstChild[parent]).toStrictEqual(childA);

          expect(Transform.prevSibling[childA]).toStrictEqual(NOOP);
          expect(Transform.nextSibling[childA]).toStrictEqual(childC);
          expect(Transform.prevSibling[childC]).toStrictEqual(childA);
          expect(Transform.nextSibling[childC]).toStrictEqual(NOOP);

          removeChild(parent, childA);

          expect(Transform.nextSibling[childA]).toStrictEqual(NOOP);
          expect(Transform.prevSibling[childA]).toStrictEqual(NOOP);

          expect(Transform.firstChild[parent]).toStrictEqual(childC);

          expect(Transform.prevSibling[childC]).toStrictEqual(NOOP);
          expect(Transform.nextSibling[childC]).toStrictEqual(NOOP);
        });
      });
    });

    describe.skip("matrix calculations", function () {
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

      test("should traverse in depth first order", () => {
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

        expect(result).toStrictEqual([1, 2, 6, 7, 3, 4, 5]);
      });

      test("should skip children if you return false", () => {
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

        const results1: number[] = [];

        traverse(1, (eid) => {
          if (eid === childA) {
            return false;
          }

          results1.push(eid);
        });

        expect(results1).toStrictEqual([1, 3, 4, 5]);

        const results2: number[] = [];

        traverse(1, (eid) => {
          if (eid === childB) {
            return false;
          }

          results2.push(eid);
        });

        expect(results2).toStrictEqual([1, 2, 6, 7]);
      });
    });
  });
});
