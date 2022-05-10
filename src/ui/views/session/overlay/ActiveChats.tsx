import { ReactNode } from "react";

import { Scroll } from "../../../atoms/scroll/Scroll";

import "./ActiveChats.css";

interface ActiveChatsProps {
  chat?: ReactNode;
  tiles: ReactNode;
}

export function ActiveChats({ chat, tiles }: ActiveChatsProps) {
  return (
    <div className="ActiveChats flex flex-column">
      <div className="ActiveChats__chat grow flex justify-end items-end">{chat}</div>
      <Scroll className="shrink-0" orientation="horizontal" type="scroll">
        <div className="flex justify-end">
          <div className="ActiveChats__tiles flex flex-row-reverse">{tiles}</div>
        </div>
      </Scroll>
    </div>
  );
}
