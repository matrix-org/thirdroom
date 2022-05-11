import { Icon } from "./Icon";
import HomeIC from "../../../../res/ic/home.svg";

export const title = "Icon";

export default function IconStories() {
  return (
    <div className="flex">
      <Icon color="surface" size="xl" src={HomeIC} />
      <Icon color="surface" size="lg" src={HomeIC} />
      <Icon color="surface" src={HomeIC} />
      <Icon color="surface-low" src={HomeIC} />
      <Icon color="world" size="sm" src={HomeIC} />
      <Icon color="primary" size="sm" src={HomeIC} />
      <Icon color="on-primary" size="xs" src={HomeIC} />
      <Icon color="secondary" size="xs" src={HomeIC} />
      <Icon color="on-secondary" size="xs" src={HomeIC} />
      <Icon color="danger" size="xs" src={HomeIC} />
      <Icon color="on-danger" size="xs" src={HomeIC} />
      <Icon color="tooltip" size="xs" src={HomeIC} />
      <Icon color="link" size="xs" src={HomeIC} />
    </div>
  );
}
