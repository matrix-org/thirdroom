import { Scroll } from "./Scroll";
import { Text } from "../text/Text";

export const title = "Scroll";

export default function ScrollStories() {
  return (
    <div className="flex" style={{ border: "1px solid red" }}>
      <div style={{ height: "300px", width: "300px", background: "white" }}>
        <Scroll type="scroll">
          {Object.keys([...Array(40)]).map((item, key: number) => (
            <Text variant="h2" key={key}>{`Text ${key}`}</Text>
          ))}
        </Scroll>
      </div>

      <div style={{ height: "300px", width: "300px", background: "white" }}>
        <Scroll type="hover" orientation="horizontal">
          <div className="flex">
            {Object.keys([...Array(40)]).map((item, key: number) => (
              <Text variant="h2" key={key}>{`Text ${key}`}</Text>
            ))}
          </div>
        </Scroll>
      </div>

      <div style={{ height: "300px", width: "300px", background: "white" }}>
        <Scroll orientation="both">
          <div className="flex">
            {Object.keys([...Array(40)]).map((item, key: number) => (
              <Text variant="h2" key={key}>{`Text ${key}`}</Text>
            ))}
          </div>
          <div>
            {Object.keys([...Array(40)]).map((item, key: number) => (
              <Text variant="h2" key={key}>{`Text ${key}`}</Text>
            ))}
          </div>
        </Scroll>
      </div>
    </div>
  );
}
