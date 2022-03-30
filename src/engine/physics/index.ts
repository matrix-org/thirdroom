import { defineComponent, defineQuery } from 'bitecs';

import { GameState } from '../GameWorker';
import { Transform } from '../component/Transform';
import { maxEntities } from '../config';

export const RigidBody = defineComponent();

export const physicsQuery = defineQuery([RigidBody]);

export const physicsSystem = ({ world, physics, time }: GameState) => {
    // const entities = physicsQuery(world);

    // for (let i = 1; i < entities.length; i++) {
    //   const eid = entities[i];
    for (let i = 0; i < maxEntities; i++) {
        const eid = i;
        const body = physics.objects[eid];

        const rigidPos = body.translation();
        const rigidRot = body.rotation();
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];

        position[0] = rigidPos.x;
        position[1] = rigidPos.y;
        position[2] = rigidPos.z;

        quaternion[0] = rigidRot.x;
        quaternion[1] = rigidRot.y;
        quaternion[2] = rigidRot.z;
        quaternion[3] = rigidRot.w;
    }

    physics.world.timestep = time.delta;
    physics.world.step();
};
