import { PaginationDot } from "./PaginationDot";

export const title = "PaginationDot";

export default function PaginationDotStories() {
  return (
    <div className="flex gap-xxs">
      {[0, 1, 2].map((v) => (
        <PaginationDot key={v} active={v === 0} />
      ))}
    </div>
  );
}
