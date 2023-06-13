import { Meta } from "@storybook/react";

import { Content } from "./Content";

export default {
  title: "Content",
  component: Content,
} as Meta<typeof Content>;

export function ContentStories() {
  return (
    <div>
      <Content top="header" bottom="footer">
        main content of page
      </Content>
    </div>
  );
}
