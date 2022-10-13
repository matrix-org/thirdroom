import { defineComponent, defineQuery, enterQuery } from "bitecs";

export const CharacterRig = defineComponent();
export const characterRigQuery = defineQuery([CharacterRig]);
export const enteredCharacterRigQuery = enterQuery(characterRigQuery);
