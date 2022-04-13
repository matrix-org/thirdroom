import { Button } from "../../src/ui/atoms/button/Button";
import { Icon } from "../../src/ui/atoms/icon/Icon";
import HomeIC from "../../res/ic/home.svg";

export function ButtonStories() {
  return (
    <div className="flex flex-wrap">
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
        <Button size="xl" variant="primary-outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xl" variant="secondary-outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="xl" variant="danger-outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button size="lg" variant="primary-outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="lg" variant="secondary-outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button size="lg" variant="danger-outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button variant="primary-outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button variant="secondary-outline" onClick={() => false}>
          Hello, World
        </Button>
        <Button variant="danger-outline" onClick={() => false}>
          Hello, World
        </Button>
      </div>

      <div>
        <Button onClick={() => false}>
          <Icon src={HomeIC} />
          Hello, World
        </Button>
        <Button variant="secondary" onClick={() => false}>
          <Icon src={HomeIC} />
          Hello, World
        </Button>
        <Button variant="danger" onClick={() => false}>
          Hello, World
          <Icon src={HomeIC} />
        </Button>
      </div>

      <div>
        <Button variant="primary-outline" onClick={() => false}>
          Hello, World
          <Icon src={HomeIC} />
        </Button>
        <Button variant="secondary-outline" onClick={() => false}>
          Hello, World
          <Icon src={HomeIC} />
        </Button>
        <Button variant="danger-outline" onClick={() => false}>
          <Icon src={HomeIC} />
          Hello, World
        </Button>
      </div>
    </div>
  );
}
