import { describe, test, expect } from "vitest";

import {
  getLastChild,
  getChildAt,
  addChild,
  removeChild,
  traverse,
  traverseReverse,
} from "../../../src/engine/component/transform";
import { RemoteNode } from "../../../src/engine/resource/RemoteResources";
import { mockGameState } from "../mocks";

describe("Transform Unit Tests", function () {
  describe("scene graph hierarchy", function () {
    describe("parenting", function () {
      describe("#getLastChild()", function () {
        test("should get last child of undefined with no children", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          expect(getLastChild(parent)).toStrictEqual(undefined);
        });
        test("should get last child of 1 children", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const child = new RemoteNode(manager);
          parent.firstChild = child;
          expect(getLastChild(parent)).toStrictEqual(child);
        });
        test("should get last child of 2 children", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const childA = new RemoteNode(manager);
          const childB = new RemoteNode(manager);
          parent.firstChild = childA;
          childA.nextSibling = childB;
          expect(getLastChild(parent)).toStrictEqual(childB);
        });
      });
      describe("#getChildAt()", function () {
        test("should get child at index 0", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const child = new RemoteNode(manager);
          parent.firstChild = child;
          expect(getChildAt(parent, 0)).toStrictEqual(child);
        });
        test("should get child at index 1", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const childA = new RemoteNode(manager);
          const childB = new RemoteNode(manager);
          parent.firstChild = childA;
          childA.nextSibling = childB;
          expect(getChildAt(parent, 1)).toStrictEqual(childB);
        });
      });
      describe("#addChild()", function () {
        test("should add one child", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const child = new RemoteNode(manager);
          addChild(parent, child);
          expect(parent.firstChild).toStrictEqual(child);
        });
        test("should add multiple children", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const childA = new RemoteNode(manager);
          const childB = new RemoteNode(manager);
          const childC = new RemoteNode(manager);
          addChild(parent, childA);
          addChild(parent, childB);
          addChild(parent, childC);
          expect(parent.firstChild).toStrictEqual(childA);
          expect(childA.prevSibling).toStrictEqual(undefined);
          expect(childA.nextSibling).toStrictEqual(childB);
          expect(childB.prevSibling).toStrictEqual(childA);
          expect(childB.nextSibling).toStrictEqual(childC);
          expect(childC.prevSibling).toStrictEqual(childB);
          expect(childC.nextSibling).toStrictEqual(undefined);
        });
      });
      describe("#removeChild", function () {
        test("should remove one child", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const child = new RemoteNode(manager);
          addChild(parent, child);
          expect(parent.firstChild).toStrictEqual(child);
          removeChild(parent, child);
          expect(parent.firstChild).toStrictEqual(undefined);
        });
        test("should remove multiple children", function () {
          const ctx = mockGameState();
          const manager = ctx.resourceManager;
          const parent = new RemoteNode(manager);
          const childA = new RemoteNode(manager);
          const childB = new RemoteNode(manager);
          const childC = new RemoteNode(manager);
          /**
           *    parent
           *   /  |  \
           *  A   B   C
           *
           */
          addChild(parent, childA);
          addChild(parent, childB);
          addChild(parent, childC);
          expect(parent.firstChild).toStrictEqual(childA);
          expect(childA.prevSibling).toStrictEqual(undefined);
          expect(childA.nextSibling).toStrictEqual(childB);
          expect(childB.prevSibling).toStrictEqual(childA);
          expect(childB.nextSibling).toStrictEqual(childC);
          expect(childC.prevSibling).toStrictEqual(childB);
          expect(childC.nextSibling).toStrictEqual(undefined);
          removeChild(parent, childB);
          expect(childB.nextSibling).toStrictEqual(undefined);
          expect(childB.prevSibling).toStrictEqual(undefined);
          expect(parent.firstChild).toStrictEqual(childA);
          expect(childA.prevSibling).toStrictEqual(undefined);
          expect(childA.nextSibling).toStrictEqual(childC);
          expect(childC.prevSibling).toStrictEqual(childA);
          expect(childC.nextSibling).toStrictEqual(undefined);
          removeChild(parent, childA);
          expect(childA.nextSibling).toStrictEqual(undefined);
          expect(childA.prevSibling).toStrictEqual(undefined);
          expect(parent.firstChild).toStrictEqual(childC);
          expect(childC.prevSibling).toStrictEqual(undefined);
          expect(childC.nextSibling).toStrictEqual(undefined);
        });
      });
    });
  });

  describe("traverse", () => {
    test("should traverse in depth first order recursively", () => {
      const ctx = mockGameState();
      const manager = ctx.resourceManager;

      /**
       * 1 --> 2 ---> 5
       *   |-> 3 ---> 6
       *   |-> 4  |-> 7
       *          |-> 8
       */

      const entity1 = new RemoteNode(manager);
      const entity2 = new RemoteNode(manager);
      const entity3 = new RemoteNode(manager);
      const entity4 = new RemoteNode(manager);
      const entity5 = new RemoteNode(manager);
      const entity6 = new RemoteNode(manager);
      const entity7 = new RemoteNode(manager);
      const entity8 = new RemoteNode(manager);
      addChild(entity1, entity2);
      addChild(entity1, entity3);
      addChild(entity1, entity4);
      addChild(entity2, entity5);
      addChild(entity3, entity6);
      addChild(entity3, entity7);
      addChild(entity3, entity8);

      const result: RemoteNode[] = [];

      traverse(entity1, (node) => result.push(node));

      expect(result).toStrictEqual([entity1, entity2, entity5, entity3, entity6, entity7, entity8, entity4]);
    });

    test("should skip children if you return false", () => {
      const ctx = mockGameState();
      const manager = ctx.resourceManager;

      /**
       *       root(1)
       *         / \
       *      A(2) B(3)
       *      /     / \
       *    E(6)  C(4) D(5)
       *    /
       *   F(7)
       */

      const root = new RemoteNode(manager);
      const childA = new RemoteNode(manager);
      const childB = new RemoteNode(manager);
      const childC = new RemoteNode(manager);
      const childD = new RemoteNode(manager);
      const childE = new RemoteNode(manager);
      const childF = new RemoteNode(manager);
      addChild(root, childA);
      addChild(root, childB);
      addChild(childB, childC);
      addChild(childB, childD);
      addChild(childA, childE);
      addChild(childE, childF);

      const results1: RemoteNode[] = [];

      traverse(root, (node) => {
        if (node === childA) {
          return false;
        }

        results1.push(node);
      });

      expect(results1).toStrictEqual([root, childB, childC, childD]);

      const results2: RemoteNode[] = [];

      traverse(root, (node) => {
        if (node === childB) {
          return false;
        }

        results2.push(node);
      });

      expect(results2).toStrictEqual([root, childA, childE, childF]);
    });

    test("should correctly traverse a sub-tree", () => {
      const ctx = mockGameState();
      const manager = ctx.resourceManager;

      /**
       *       A(1)
       *         / \
       *      B(2) C(root 3)
       *      /     / \
       *    F(6)  D(4) E(5)
       *    /
       *   G(7)
       */

      const entityA = new RemoteNode(manager);
      const entityB = new RemoteNode(manager);
      const entityC = new RemoteNode(manager);
      const entityD = new RemoteNode(manager);
      const entityE = new RemoteNode(manager);
      const entityF = new RemoteNode(manager);
      const entityG = new RemoteNode(manager);
      addChild(entityA, entityB);
      addChild(entityA, entityC);
      addChild(entityC, entityD);
      addChild(entityC, entityE);
      addChild(entityB, entityF);
      addChild(entityF, entityG);

      const results: RemoteNode[] = [];

      traverse(entityC, (node) => {
        results.push(node);
      });

      expect(results).toStrictEqual([entityC, entityD, entityE]);
    });

    test("should traverse a single entity", () => {
      const ctx = mockGameState();
      const manager = ctx.resourceManager;

      const entityA = new RemoteNode(manager);
      const entityB = new RemoteNode(manager);
      const entityC = new RemoteNode(manager);

      addChild(entityA, entityB);
      addChild(entityA, entityC);

      const results: RemoteNode[] = [];

      traverse(entityB, (node) => {
        results.push(node);
      });

      expect(results).toStrictEqual([entityB]);
    }, 1000);
  });

  describe("traverseReverse", () => {
    test("should traverse with reverse ordering", () => {
      const ctx = mockGameState();
      const manager = ctx.resourceManager;

      /**
       *       root(1)
       *         / \
       *      A(2) B(3)
       *      /     / \
       *    E(6)  C(4) D(5)
       *    /
       *   F(7)
       */

      const root = new RemoteNode(manager);
      const childA = new RemoteNode(manager);
      const childB = new RemoteNode(manager);
      const childC = new RemoteNode(manager);
      const childD = new RemoteNode(manager);
      const childE = new RemoteNode(manager);
      const childF = new RemoteNode(manager);
      addChild(root, childA);
      addChild(root, childB);
      addChild(childB, childC);
      addChild(childB, childD);
      addChild(childA, childE);
      addChild(childE, childF);

      const result: RemoteNode[] = [];

      traverseReverse(root, (eid) => result.push(eid));

      expect(result).toStrictEqual([childD, childC, childB, childF, childE, childA, root]);
    });
  });
});
