import { ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../atoms/text/Text";
import "./BlogSection.css";

function LeftRightContent({
  title,
  content,
  imgSrc,
  imgAlt,
  flipped = false,
}: {
  title: ReactNode;
  content: ReactNode;
  imgSrc: string;
  imgAlt: string;
  flipped?: boolean;
}) {
  return (
    <div className={classNames("LeftRightContent", { "LeftRightContent--flipped": flipped })}>
      <div className="LeftRightContent__text flex flex-column gap-md">
        {title}
        {content}
      </div>
      <div className="LeftRightContent__image">
        <img src={imgSrc} alt={imgAlt} />
      </div>
    </div>
  );
}

export function BlogSection() {
  const poster = "https://matrix-client.matrix.org/_matrix/media/r0/download/matrix.org/uBbjXXiIeSBvjLAKirLSjReL";
  return (
    <section className="BlogSection flex flex-column items-center gap-xl">
      <LeftRightContent
        title={
          <Text variant="h2" weight="semi-bold">
            Heading
          </Text>
        }
        content={
          <Text>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore nostrum doloribus magnam, neque itaque
            laborum maxime nisi illo saepe dicta in architecto tempore voluptates illum ex? Excepturi dicta explicabo
            numquam!
          </Text>
        }
        imgSrc={poster}
        imgAlt="image"
      />
      <LeftRightContent
        flipped={true}
        title={
          <Text variant="h2" weight="semi-bold">
            Heading
          </Text>
        }
        content={
          <Text>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore nostrum doloribus magnam, neque itaque
            laborum maxime nisi illo saepe dicta in architecto tempore voluptates illum ex? Excepturi dicta explicabo
            numquam! Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore nostrum doloribus magnam, neque
            itaque laborum maxime nisi illo saepe dicta in architecto tempore voluptates illum ex? Excepturi dicta
            explicabo numquam!
            <br />
            <br />
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore nostrum doloribus magnam, neque itaque
            laborum maxime nisi illo saepe dicta in architecto tempore voluptates illum ex? Excepturi dicta explicabo
            numquam!
          </Text>
        }
        imgSrc={poster}
        imgAlt="image"
      />
    </section>
  );
}
