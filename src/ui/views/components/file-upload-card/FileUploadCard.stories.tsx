import { FileUploadCard } from "./FileUploadCard";

export const title = "File Upload";

export default function FileUploadStories() {
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
