import { ReactNode } from "react";

import { Scroll } from "../atoms/scroll/Scroll";
import { FooterSection } from "./FooterSection";
import { NavigationBar } from "./NavigationBar";
import "./Site.css";

export default function Site({ children }: { children: ReactNode }) {
  return (
    <div className="Site flex flex-column">
      <NavigationBar />
      <div className="grow">
        <Scroll type="scroll">
          {children}
          <FooterSection />
        </Scroll>
      </div>
    </div>
  );
}
