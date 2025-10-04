import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero-section";
import { MarketplaceSection } from "@/components/sections/marketplace-section";
import { QuizSection } from "@/components/sections/quiz-section";
import { HowItWorksSection } from "@/components/sections/how-it-works";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <MarketplaceSection />
        <QuizSection />
        <HowItWorksSection />
      </main>
    </div>
  );
};

export default Index;