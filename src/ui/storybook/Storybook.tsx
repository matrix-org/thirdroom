import { useAsync } from "../hooks/useAsync";
import "./Storybook.css";

const stories = import.meta.glob("../**/*.stories.tsx");

export function Storybook() {
  const { loading, error, value } = useAsync(async () => {
    const results = await Promise.all(Object.values(stories).map((fn) => fn()));
    return results.map((result) => ({ Component: result.default, title: result.title || result.default.name }));
  }, []);

  if (error) {
    return <div>{error.message}</div>;
  }

  if (loading || !value) {
    return <div>Loading...</div>;
  }

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
