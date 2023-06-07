import { ContentSection } from "./ContentSection";
import { HeroSection } from "./HeroSection";
import Site from "./Site";

export default function LandingPage() {
  return (
    <Site>
      <HeroSection />
      <div style={{ height: 70 }} />
      <ContentSection />
    </Site>
  );
}
