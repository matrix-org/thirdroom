import "@fontsource/inter/variable.css";
import "@fontsource/noto-serif/latin.css";
import "../src/ui/App.css";
import Storybook from "../src/ui/storybook/Storybook";

export const baseDecorator = (Story) => {
  return (
    <Storybook>
      <Story />
    </Storybook>
  );
};
