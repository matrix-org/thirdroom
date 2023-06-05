import { Scroll } from "../atoms/scroll/Scroll";
import { ContentSection } from "./ContentSection";
import { FooterSection } from "./FooterSection";
import { HeroSection } from "./HeroSection";
import { NavigationBar } from "./NavigationBar";
import "./Site.css";

export default function Site() {
  return (
    <div className="Site flex flex-column">
      <NavigationBar />
      <div className="grow">
        <Scroll type="scroll">
          <HeroSection />
          <div style={{ height: 70 }} />
          <ContentSection />
          <FooterSection />
        </Scroll>
      </div>
    </div>
  );
}
