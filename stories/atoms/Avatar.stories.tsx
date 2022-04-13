import { Avatar } from "../../src/ui/atoms//avatar/Avatar";

export function AvatarStories() {
  const imgSrc = "https://cdn.britannica.com/92/80592-050-86EF29F3/Mouflon-ram.jpg";

  return (
    <div className="flex">
      <Avatar size="extra-large" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="large" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="small" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="extra-small" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar size="ultra-small" name="Ram" imageSrc={imgSrc} bgColor="black" />

      <Avatar isCircle size="extra-large" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="large" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="small" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="extra-small" name="Ram" imageSrc={imgSrc} bgColor="black" />
      <Avatar isCircle size="ultra-small" name="Ram" imageSrc={imgSrc} bgColor="black" />
    </div>
  );
}
