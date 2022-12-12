import { Document, ILogger, MathUtils, Mesh, Node, Texture, Transform, vec3, vec4 } from "@gltf-transform/core";
import { InstancedMesh, MeshGPUInstancing } from "@gltf-transform/extensions";

import { MXLightmap, MXLightmapExtension } from "../extensions/MXLightmapExtension";

const NAME = "extension-aware-instance";

function createObjectKeyMap<O>() {
  const map = new Map<O, number>();
  let counter = 0;

  return (obj: O) => {
    let id = map.get(obj);

    if (id === undefined) {
      id = counter++;
      map.set(obj, id);
    }

    return id;
  };
}

function createInstanceKeyMap() {
  const getMeshKey = createObjectKeyMap<Mesh>();
  const getLightMapKey = createObjectKeyMap<Texture>();

  return (node: Node) => {
    const mesh = node.getMesh();
    const lightMap = node.getExtension<MXLightmap>(MXLightmapExtension.EXTENSION_NAME)?.getLightMapTexture();

    if (!mesh) {
      return null;
    }

    if (node.getSkin()) {
      return null;
    }

    return `mesh-${getMeshKey(mesh)}` + (lightMap ? `-lightmap-${getLightMapKey(lightMap)}` : "");
  };
}

export function extensionAwareInstance(): Transform {
  const fn = (doc: Document) => {
    const logger = doc.getLogger();
    const root = doc.getRoot();
    const batchExtension = doc.createExtension(MeshGPUInstancing);

    let numBatches = 0;
    let numInstances = 0;

    const excludedNodes = new Set<Node>();

    for (const animation of root.listAnimations()) {
      for (const channel of animation.listChannels()) {
        const target = channel.getTargetNode();

        if (target) {
          target.traverse((node) => {
            excludedNodes.add(node);
          });
        }
      }
    }

    for (const scene of root.listScenes()) {
      // Gather a one-to-many Mesh/Node mapping, identifying what we can instance.
      const meshInstances = new Map<string, { mesh: Mesh; nodes: Set<Node>; lightMap?: MXLightmap }>();
      const getInstanceKey = createInstanceKeyMap();

      scene.traverse((node) => {
        if (excludedNodes.has(node)) {
          return;
        }

        const instanceKey = getInstanceKey(node);

        if (instanceKey) {
          let instanceRecord = meshInstances.get(instanceKey);

          if (!instanceRecord) {
            const lightMap = node.getExtension<MXLightmap>(MXLightmapExtension.EXTENSION_NAME)?.clone();

            if (lightMap) {
              lightMap.setOffset([0, 0]);
              lightMap.setScale([1, 1]);
            }

            instanceRecord = { mesh: node.getMesh()!, nodes: new Set(), lightMap };
            meshInstances.set(instanceKey, instanceRecord);
          }

          instanceRecord.nodes.add(node);
        }
      });

      for (const [, { mesh, nodes, lightMap }] of meshInstances) {
        if (nodes.size < 2) {
          continue;
        }

        // For each Mesh, create an InstancedMesh and collect transforms.
        const modifiedNodes = [];

        const nodesArr = Array.from(nodes);

        const batch = createBatch(doc, batchExtension, mesh, nodes.size, !!lightMap);
        const batchTranslation = batch.getAttribute("TRANSLATION")!;
        const batchRotation = batch.getAttribute("ROTATION")!;
        const batchScale = batch.getAttribute("SCALE")!;

        const batchNode = doc
          .createNode()
          .setName(nodesArr[0].getName() + "-instanced")
          .setMesh(mesh)
          .setExtension("EXT_mesh_gpu_instancing", batch);

        if (lightMap) {
          batchNode.setExtension(MXLightmapExtension.EXTENSION_NAME, lightMap);
        }

        scene.addChild(batchNode);

        let needsTranslation = false;
        let needsRotation = false;
        let needsScale = false;

        // For each Node, write TRS properties into instance attributes.
        for (let i = 0; i < nodesArr.length; i++) {
          let t: vec3;
          let r: vec4;
          let s: vec3;

          const node = nodesArr[i];

          batchTranslation.setElement(i, (t = node.getWorldTranslation()));
          batchRotation.setElement(i, (r = node.getWorldRotation()));
          batchScale.setElement(i, (s = node.getWorldScale()));

          if (lightMap) {
            const nodeLightMap = node.getExtension<MXLightmap>(MXLightmapExtension.EXTENSION_NAME)!;
            const batchLightmapOffset = batch.getAttribute("_LIGHTMAP_OFFSET")!;
            const batchLightmapScale = batch.getAttribute("_LIGHTMAP_SCALE")!;
            batchLightmapOffset.setElement(i, nodeLightMap.getOffset());
            batchLightmapScale.setElement(i, nodeLightMap.getScale());
            node.setExtension(MXLightmapExtension.EXTENSION_NAME, null);
          }

          if (!MathUtils.eq(t, [0, 0, 0])) needsTranslation = true;
          if (!MathUtils.eq(r, [0, 0, 0, 1])) needsRotation = true;
          if (!MathUtils.eq(s, [1, 1, 1])) needsScale = true;

          // Mark the node for cleanup.
          node.setMesh(null);
          modifiedNodes.push(node);
        }

        if (!needsTranslation) batchTranslation.dispose();
        if (!needsRotation) batchRotation.dispose();
        if (!needsScale) batchScale.dispose();

        pruneUnusedNodes(modifiedNodes, logger);

        numBatches++;
        numInstances += nodesArr.length;
      }
    }

    if (numBatches > 0) {
      logger.info(`${NAME}: Created ${numBatches} batches, with ${numInstances} total instances.`);
    } else {
      logger.info(`${NAME}: No meshes with multiple parent nodes were found.`);
      batchExtension.dispose();
    }

    logger.debug(`${NAME}: Complete.`);
  };

  Object.defineProperty(fn, "name", { value: "extension-aware-instance" });

  return fn;
}

function pruneUnusedNodes(nodes: Node[], logger: ILogger): void {
  let node: Node | undefined;
  let unusedNodes = 0;
  while ((node = nodes.pop())) {
    if (
      node.listChildren().length ||
      node.getCamera() ||
      node.getMesh() ||
      node.getSkin() ||
      node.listExtensions().length
    ) {
      continue;
    }
    const nodeParent = node.getParent();
    if (nodeParent instanceof Node) {
      nodes.push(nodeParent);
    }
    node.dispose();
    unusedNodes++;
  }

  logger.debug(`${NAME}: Removed ${unusedNodes} unused nodes.`);
}

function createBatch(
  doc: Document,
  batchExtension: MeshGPUInstancing,
  mesh: Mesh,
  count: number,
  useLightmap: boolean
): InstancedMesh {
  const buffer = mesh.listPrimitives()[0].getAttribute("POSITION")!.getBuffer();

  const batchTranslation = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array(3 * count))
    .setBuffer(buffer);
  const batchRotation = doc
    .createAccessor()
    .setType("VEC4")
    .setArray(new Float32Array(4 * count))
    .setBuffer(buffer);
  const batchScale = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array(3 * count))
    .setBuffer(buffer);

  const instancedMesh = batchExtension
    .createInstancedMesh()
    .setAttribute("TRANSLATION", batchTranslation)
    .setAttribute("ROTATION", batchRotation)
    .setAttribute("SCALE", batchScale);

  if (useLightmap) {
    const batchLightmapScale = doc
      .createAccessor()
      .setType("VEC2")
      .setArray(new Float32Array(2 * count))
      .setBuffer(buffer);
    const batchLightmapOffset = doc
      .createAccessor()
      .setType("VEC2")
      .setArray(new Float32Array(2 * count))
      .setBuffer(buffer);

    instancedMesh
      .setAttribute("_LIGHTMAP_SCALE", batchLightmapScale)
      .setAttribute("_LIGHTMAP_OFFSET", batchLightmapOffset);
  }

  return instancedMesh;
}
