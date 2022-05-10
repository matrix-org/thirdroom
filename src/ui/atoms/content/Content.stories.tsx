import { Content } from "./Content";

export const title = "Content";

export default function ContentStories() {
  return (
    <div>
      <Content top="header" bottom="footer">
        main content of page
      </Content>
    </div>
  );
}
