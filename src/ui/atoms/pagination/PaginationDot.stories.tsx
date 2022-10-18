import { PaginationDot } from "./PaginationDot";

export const title = "PaginationDot";

export default function PaginationDotStories() {
  return (
    <div className="flex">
      <PaginationDot max={3} value={1} />
    </div>
  );
}
