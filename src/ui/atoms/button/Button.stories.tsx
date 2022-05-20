import { Button } from "./Button";
import { Icon } from "../icon/Icon";
import HomeIC from "../../../../res/ic/home.svg";

export const title = "Button";

export default function ButtonStories() {
  return (
    <div className="flex flex-wrap">
      <div>
        <Button size="xxl" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xxl" variant="secondary" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xxl" variant="danger" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="xl" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xl" variant="secondary" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xl" variant="danger" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="lg" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="lg" variant="secondary" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="lg" variant="danger" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button onClick={() => false}>Hello, World</Button>
        <Button variant="secondary" onClick={() => false}>
          Hello, World
        </Button>
        <Button variant="danger" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="sm" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="sm" variant="secondary" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="sm" variant="danger" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="xs" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xs" variant="secondary" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xs" variant="danger" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="xxl" variant="primary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xxl" variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xxl" variant="danger" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="xl" variant="primary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xl" variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xl" variant="danger" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="lg" variant="primary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="lg" variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="lg" variant="danger" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button variant="primary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button variant="danger" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="sm" variant="primary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="sm" variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="sm" variant="danger" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="xs" variant="primary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xs" variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xs" variant="danger" fill="outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button onClick={() => false}>
          <Icon color="on-primary" src={HomeIC} />
          Hello, World
        </Button>
        <Button variant="secondary" onClick={() => false}>
          <Icon color="on-secondary" src={HomeIC} />
          Hello, World
        </Button>
        <Button variant="danger" onClick={() => false}>
          Hello, World
          <Icon color="on-danger" src={HomeIC} />
        </Button>
      </div>

      <div>
        <Button variant="primary" fill="outline" onClick={() => false}>
          Hello, World
          <Icon color="primary" src={HomeIC} />
        </Button>
        <Button variant="secondary" fill="outline" onClick={() => false}>
          Hello, World
          <Icon color="secondary" src={HomeIC} />
        </Button>
        <Button variant="danger" fill="outline" onClick={() => false}>
          <Icon color="danger" src={HomeIC} />
          Hello, World
        </Button>
      </div>
    </div>
  );
}
