import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { useComponent } from "../../../hooks/useComponent";
import { ComponentPropertyContainer } from "./ComponentPropertyContainer";

export function ComponentContainer({ id }: { id: number }) {
  const component = useComponent(id);

  if (!component) {
    return null;
  }

  const { name, props, removeComponent } = component;

  return (
    <div className="flex flex-column">
      <div className="flex items-center justify-between">
        <Text variant="b2" weight="bold">
          {name}
        </Text>
        <Button variant="danger" size="xs" onClick={removeComponent}>
          Remove
        </Button>
      </div>
      <div className="flex flex-column gap-sm">
        {props.map((prop) => (
          <ComponentPropertyContainer key={prop.id} {...prop} />
        ))}
      </div>
    </div>
  );
}
