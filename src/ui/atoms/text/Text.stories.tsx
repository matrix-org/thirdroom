import { Text } from "./Text";

export const title = "Text";

export default function TextStories() {
  return (
    <div className="flex flex-wrap">
      <div>
        <Text variant="h2" weight="light">
          Paragraph
        </Text>
        <Text variant="s1" weight="light">
          Paragraph
        </Text>
        <Text weight="light">Paragraph</Text>
        <Text variant="b2" weight="light">
          Paragraph
        </Text>
        <Text variant="b3" weight="light">
          Paragraph
        </Text>
      </div>

      <div>
        <Text variant="h2" color="surface-low">
          Paragraph
        </Text>
        <Text variant="s1" color="world">
          Paragraph
        </Text>
        <Text color="primary">Paragraph</Text>
        <Text variant="b2" color="on-primary">
          Paragraph
        </Text>
        <Text variant="b3" color="secondary">
          Paragraph
        </Text>
      </div>

      <div>
        <Text variant="h2" color="on-secondary" weight="medium">
          Paragraph
        </Text>
        <Text variant="s1" color="danger" weight="medium">
          Paragraph
        </Text>
        <Text weight="medium" color="on-danger">
          Paragraph
        </Text>
        <Text variant="b2" color="tooltip" weight="medium">
          Paragraph
        </Text>
        <Text variant="b3" color="link" weight="medium">
          Paragraph
        </Text>
      </div>

      <div>
        <Text variant="h2" weight="semi-bold">
          Paragraph
        </Text>
        <Text variant="s1" weight="semi-bold">
          Paragraph
        </Text>
        <Text weight="semi-bold">Paragraph</Text>
        <Text variant="b2" weight="semi-bold">
          Paragraph
        </Text>
        <Text variant="b3" weight="semi-bold">
          Paragraph
        </Text>
      </div>

      <div>
        <Text variant="h2" weight="bold">
          Paragraph
        </Text>
        <Text variant="s1" weight="bold">
          Paragraph
        </Text>
        <Text weight="bold">Paragraph</Text>
        <Text variant="b2" weight="bold">
          Paragraph
        </Text>
        <Text variant="b3" weight="bold">
          Paragraph
        </Text>
      </div>
    </div>
  );
}
