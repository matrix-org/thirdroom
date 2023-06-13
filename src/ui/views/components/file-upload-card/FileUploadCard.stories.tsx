import { Meta } from "@storybook/react";

import { FileUploadCard } from "./FileUploadCard";

export default {
  title: "FileUploadCard",
  component: FileUploadCard,
} as Meta<typeof FileUploadCard>;

export function FileUploadStories() {
  return (
    <div>
      <FileUploadCard
        name="Mars-is-red-planet.glb"
        sentBytes={5423}
        totalBytes={23434}
        onUploadDrop={() => console.log("dropped")}
      />
    </div>
  );
}
