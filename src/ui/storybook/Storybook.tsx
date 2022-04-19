import "./Storybook.css";

const stories = import.meta.globEager("../**/*.stories.tsx");

export default function Storybook() {
  const value = Object.values(stories).map((result) => ({
    Component: result.default,
    title: result.title || result.default.name,
  }));

  return (
    <div className="Storybook">
      {value.map(({ Component, title }) => (
        <div className="Storybook__story">
          <h1 className="Storybook__story-title">{title}</h1>
          <Component />
        </div>
      ))}
    </div>
  );
}
