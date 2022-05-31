import { defineComponent, defineQuery, enterQuery, exitQuery } from "bitecs";

export const Player = defineComponent({});

export const playerQuery = defineQuery([Player]);
export const enteredPlayerQuery = enterQuery(playerQuery);
export const exitedPlayerQuery = exitQuery(playerQuery);
