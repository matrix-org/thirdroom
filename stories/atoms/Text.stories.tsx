import { Text } from "../../src/ui/atoms/text/Text";

export function TextStories() {
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
        <Text variant="h2">Paragraph</Text>
        <Text variant="s1">Paragraph</Text>
        <Text>Paragraph</Text>
        <Text variant="b2">Paragraph</Text>
        <Text variant="b3">Paragraph</Text>
      </div>

      <div>
        <Text variant="h2" weight="medium">
          Paragraph
        </Text>
        <Text variant="s1" weight="medium">
          Paragraph
        </Text>
        <Text weight="medium">Paragraph</Text>
        <Text variant="b2" weight="medium">
          Paragraph
        </Text>
        <Text variant="b3" weight="medium">
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
