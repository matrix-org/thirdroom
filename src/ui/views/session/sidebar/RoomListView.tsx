import "./RoomListView.css";
import { Scroll } from "../../../atoms/scroll/Scroll";

interface RoomListViewProps {
  header: React.ReactNode;
  content: React.ReactNode;
}

export function RoomListView({ header, content }: RoomListViewProps) {
  return (
    <div className="RoomListView flex flex-column">
      {header}
      <div className="RoomListView__container grow">
        <Scroll type="hover">{content}</Scroll>
      </div>
    </div>
  );
}
