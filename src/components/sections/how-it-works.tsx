import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Clock, Repeat } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "List your skills and what you'd like to learn. Set your availability and preferred time slots.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Search,
    title: "Find Skills to Trade", 
    description: "Browse our marketplace and find skills you need. Connect with providers who match your requirements.",
    color: "bg-credit/10 text-credit"
  },
  {
    icon: Clock,
    title: "Exchange Time",
    description: "Spend an hour teaching your skill to earn 1 credit. Use credits to learn from others - it's that simple!",
    color: "bg-success/10 text-success"
  },
  {
    icon: Repeat,
    title: "Keep Growing",
    description: "Build your reputation, expand your skills, and become part of a thriving time-based economy.",
    color: "bg-warning/10 text-warning"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the time economy in four simple steps. Start trading your skills today.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {steps.map((step, index) => (
              <Card key={index} className="text-center group hover:shadow-card transition-smooth border-border/50">
                <CardContent className="pt-8 pb-6 space-y-4">
                  <div className="relative">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} transition-smooth group-hover:scale-110`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-smooth">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Example flow */}
          <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card">
            <h3 className="text-xl font-semibold text-center mb-6">Real Example</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center space-y-2">
                <div className="text-2xl">🐍</div>
                <div className="font-medium">Teach Python</div>
                <div className="text-sm text-muted-foreground">1 hour session</div>
              </div>
              
              <div className="text-2xl text-primary">→</div>
              
              <div className="flex-1 text-center space-y-2">
                <div className="text-2xl">⏰</div>
                <div className="font-medium">Earn 1 Credit</div>
                <div className="text-sm text-muted-foreground">Added to your wallet</div>
              </div>
              
              <div className="text-2xl text-primary">→</div>
              
              <div className="flex-1 text-center space-y-2">
                <div className="text-2xl">🎨</div>
                <div className="font-medium">Learn Design</div>
                <div className="text-sm text-muted-foreground">1 hour with expert</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link to="/signup">
              <Button size="lg" variant="hero">
                Start Your Time Trading Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};