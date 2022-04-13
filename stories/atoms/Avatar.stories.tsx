import { Avatar } from "../../src/ui/atoms/avatar/Avatar";

export function AvatarStories() {
  const imgSrc = "https://cdn.britannica.com/92/80592-050-86EF29F3/Mouflon-ram.jpg";

  return (
    <div className="flex">
      <Avatar size="xl" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="lg" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="sm" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="xs" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="xxs" name="Ram" imageSrc={imgSrc} bgColor="black" />

      <Avatar isCircle size="xl" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="lg" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="sm" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="xs" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="xxs" name="Ram" imageSrc={imgSrc} bgColor="black" />
    </div>
  );
}
