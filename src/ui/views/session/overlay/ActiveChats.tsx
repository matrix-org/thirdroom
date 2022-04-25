import "./ActiveChats.css";

interface ActiveChatsProps {
  chat?: React.ReactNode;
  tiles: React.ReactNode;
}

export function ActiveChats({ chat, tiles }: ActiveChatsProps) {
  return (
    <div className="ActiveChats flex flex-column">
      <div className="grow flex justify-end items-end">{chat}</div>
      <div className="ActiveChats__tiles shrink-0 flex flex-wrap-reverse flex-row-reverse">{tiles}</div>
    </div>
  );
}
