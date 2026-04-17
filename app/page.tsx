import { HeroSection } from "@/components/HeroSection";
import { FeaturedCompounds } from "@/components/FeaturedCompounds";
import { TestingWorkflow } from "@/components/TestingWorkflow";
import { ResearchStats } from "@/components/ResearchStats";
import { EverythingYouGet } from "@/components/EverythingYouGet";
import { FAQSection } from "@/components/FAQSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeaturedCompounds />
      <TestingWorkflow />
      <ResearchStats />
      <EverythingYouGet />
      <FAQSection />
    </main>
  );
}
