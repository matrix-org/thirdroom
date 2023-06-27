import { Meta } from "@storybook/react";

import { Footer } from "./Footer";

export default {
  title: "Footer",
  component: Footer,
} as Meta<typeof Footer>;

export function FooterStories() {
  return (
    <div>
      <Footer left="left" center="center" right="right" />
    </div>
  );
}
