import { Avatar } from "../../src/ui/atoms/avatar/Avatar";
import { AvatarPile } from "../../src/ui/atoms/avatar/AvatarPile";

export function AvatarStories() {
  const imgSrc = "https://cdn.britannica.com/92/80592-050-86EF29F3/Mouflon-ram.jpg";

  return (
    <div className="flex items-start flex-wrap">
      <div className="flex flex-column">
        <div>
          <Avatar size="xl" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar size="lg" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar size="sm" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar size="xs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar size="xxs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
        </div>
        <div>
          <Avatar isCircle size="xl" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="lg" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="sm" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="xs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="xxs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
        </div>
      </div>

      <div>
        <AvatarPile>
          <Avatar isCircle size="xl" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="xl" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar isCircle size="xl" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar isCircle size="xl" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar isCircle size="lg" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="lg" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar isCircle size="lg" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar isCircle size="lg" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar isCircle size="md" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="md" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar isCircle size="md" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar isCircle size="md" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar isCircle size="sm" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="sm" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar isCircle size="sm" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar isCircle size="sm" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar isCircle size="xs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="xs" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar isCircle size="xs" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar isCircle size="xs" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar isCircle size="xxs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar isCircle size="xxs" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar isCircle size="xxs" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar isCircle size="xxs" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
      </div>
    </div>
  );
}
