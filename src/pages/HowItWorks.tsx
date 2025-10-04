import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Clock, Repeat, ArrowRight, CheckCircle } from "lucide-react";
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

const features = [
  "No money required - only time",
  "Learn from real experts",
  "Build your professional network",
  "Flexible scheduling",
  "Verified skill providers",
  "Community-driven platform"
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">
            How It <span className="text-primary">Works</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join the time economy in four simple steps. Start trading your skills today and build a community of learners and teachers.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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

        {/* Example Flow */}
        <Card className="mb-16 border border-border/50 shadow-card">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-center mb-8">Real Example</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center space-y-3">
                <div className="text-4xl">🐍</div>
                <div className="font-semibold text-lg">Teach Python</div>
                <div className="text-muted-foreground">1 hour session</div>
                <div className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full inline-block">
                  You earn 1 credit
                </div>
              </div>
              
              <div className="text-3xl text-primary">
                <ArrowRight className="h-8 w-8" />
              </div>
              
              <div className="flex-1 text-center space-y-3">
                <div className="text-4xl">⏰</div>
                <div className="font-semibold text-lg">Credit Added</div>
                <div className="text-muted-foreground">To your wallet</div>
                <div className="text-sm bg-credit/10 text-credit px-3 py-1 rounded-full inline-block">
                  Ready to spend
                </div>
              </div>
              
              <div className="text-3xl text-primary">
                <ArrowRight className="h-8 w-8" />
              </div>
              
              <div className="flex-1 text-center space-y-3">
                <div className="text-4xl">🎨</div>
                <div className="font-semibold text-lg">Learn Design</div>
                <div className="text-muted-foreground">1 hour with expert</div>
                <div className="text-sm bg-success/10 text-success px-3 py-1 rounded-full inline-block">
                  Spend 1 credit
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Why Choose SkillSwap?</h3>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary/5 to-credit/5 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Start?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of learners and teachers who are already building their skills through time exchange.
            </p>
            <div className="space-y-3">
              <Link to="/signup" className="block">
                <Button size="lg" className="w-full">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/marketplace" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  Browse Skills
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mb-16">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-2">How do I earn credits?</h4>
                <p className="text-muted-foreground text-sm">
                  Teach any skill for 1 hour to earn 1 credit. The more you teach, the more credits you earn.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What skills can I teach?</h4>
                <p className="text-muted-foreground text-sm">
                  Any skill you're good at! Programming, design, languages, music, fitness, cooking, and more.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">How do sessions work?</h4>
                <p className="text-muted-foreground text-sm">
                  Sessions are typically 1 hour long and can be conducted via video call or in-person.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is it really free?</h4>
                <p className="text-muted-foreground text-sm">
                  Yes! No money is exchanged. You only trade your time and knowledge with others.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4">Start Your Time Trading Journey Today</h3>
          <p className="text-muted-foreground mb-6">
            Join our community and start exchanging skills with people around the world.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="hero">
              Get Started Free
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
