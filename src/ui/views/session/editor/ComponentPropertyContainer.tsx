import { ComponentPropertyInfo, ComponentPropertyType } from "../../../../engine/component/types";
import { Vector3Input } from "../../../atoms/input/Vector3Input";
import { Label } from "../../../atoms/text/Label";
import { useComponentProperty } from "../../../hooks/useComponentProperty";

export function ComponentPropertyContainer({ id, name, type }: ComponentPropertyInfo) {
  const props = useComponentProperty<typeof type>(id);

  if (type === ComponentPropertyType.vec3) {
    return (
      <div className="flex flex-column gap-xxs">
        <Label className="shrink-0">{name}:</Label>
        <Vector3Input {...props} />
      </div>
    );
  } else {
    return <div>{name}</div>;
  }
}
