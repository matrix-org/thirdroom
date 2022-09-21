import { FunctionComponent } from "react";
import "./Storybook.css";

interface Story {
  default: FunctionComponent;
  title?: string;
}

const stories = import.meta.glob<true, string, Story>("../**/*.stories.tsx", { eager: true });

export default function Storybook() {
  const value = Object.values(stories).map((result) => ({
    Component: result.default,
    title: result.title || result.default.name,
  }));

  return (
    <div className="Storybook">
      {value.map(({ Component, title }) => (
        <div className="Storybook__story" key={title}>
          <h1 className="Storybook__story-title">{title}</h1>
          <Component />
        </div>
      ))}
    </div>
  );
}
