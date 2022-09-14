import { Scroll } from "../atoms/scroll/Scroll";
import { BlogSection } from "./BlogSection";
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
          <BlogSection />
          <FooterSection />
        </Scroll>
      </div>
    </div>
  );
}
