import { Avatar } from "./Avatar";
import { AvatarPile } from "./AvatarPile";
import { AvatarBadgeWrapper } from "./AvatarBadgeWrapper";
import { AvatarOutline } from "./AvatarOutline";
import { StatusBadge } from "../badge/StatusBadge";

export const title = "Avatar";

export default function AvatarStories() {
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
          <Avatar shape="circle" size="xl" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="lg" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="sm" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="xs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="xxs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
        </div>
      </div>

      <div>
        <AvatarPile>
          <Avatar shape="circle" size="xl" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="xl" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar shape="circle" size="xl" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar shape="circle" size="xl" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar shape="circle" size="lg" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="lg" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar shape="circle" size="lg" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar shape="circle" size="lg" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar shape="circle" size="md" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="md" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar shape="circle" size="md" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar shape="circle" size="md" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar shape="circle" size="sm" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="sm" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar shape="circle" size="sm" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar shape="circle" size="sm" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar shape="circle" size="xs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="xs" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar shape="circle" size="xs" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar shape="circle" size="xs" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
        <AvatarPile>
          <Avatar shape="circle" size="xxs" name="Ram" imageSrc={imgSrc} bgColor="#2a38e7" />
          <Avatar shape="circle" size="xxs" name="Sam" imageSrc={imgSrc} bgColor="blue" />
          <Avatar shape="circle" size="xxs" name="Lucky" imageSrc={imgSrc} bgColor="red" />
          <Avatar shape="circle" size="xxs" name="Man" imageSrc={imgSrc} bgColor="green" />
        </AvatarPile>
      </div>
      <div>
        <AvatarBadgeWrapper badge={<Avatar size="xxs" name="Sam" imageSrc={imgSrc} bgColor="green" />}>
          <Avatar shape="circle" size="lg" name="Sam" imageSrc={imgSrc} bgColor="blue" />
        </AvatarBadgeWrapper>
        <AvatarBadgeWrapper badge={<StatusBadge status="offline" />}>
          <Avatar shape="circle" size="lg" name="Sam" imageSrc={imgSrc} bgColor="blue" />
        </AvatarBadgeWrapper>
        <AvatarBadgeWrapper badge={<StatusBadge status="online" />}>
          <Avatar shape="circle" size="lg" name="Sam" imageSrc={imgSrc} bgColor="blue" />
        </AvatarBadgeWrapper>
        <AvatarBadgeWrapper badge={<StatusBadge status="dnd" />}>
          <Avatar shape="circle" size="lg" name="Sam" imageSrc={imgSrc} bgColor="blue" />
        </AvatarBadgeWrapper>
      </div>
      <div>
        <AvatarOutline>
          <Avatar shape="circle" size="xl" name="Sam" imageSrc={imgSrc} bgColor="green" />
        </AvatarOutline>
        <AvatarOutline>
          <Avatar shape="circle" size="lg" name="Sam" imageSrc={imgSrc} bgColor="green" />
        </AvatarOutline>
        <AvatarOutline>
          <Avatar shape="circle" size="md" name="Sam" imageSrc={imgSrc} bgColor="green" />
        </AvatarOutline>
        <AvatarOutline>
          <Avatar shape="circle" size="sm" name="Sam" imageSrc={imgSrc} bgColor="green" />
        </AvatarOutline>
        <AvatarOutline>
          <Avatar shape="circle" size="xs" name="Sam" imageSrc={imgSrc} bgColor="green" />
        </AvatarOutline>
        <AvatarOutline>
          <Avatar shape="circle" size="xxs" name="Sam" imageSrc={imgSrc} bgColor="green" />
        </AvatarOutline>
      </div>
    </div>
  );
}
