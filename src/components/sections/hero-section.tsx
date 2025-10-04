import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/credit-badge";
import { ArrowRight, Clock, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Announcement badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full border border-accent-foreground/20">
            <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm font-medium text-accent-foreground">
              Join the Time Economy Revolution
            </span>
          </div>

          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Trade <span className="bg-gradient-hero bg-clip-text text-transparent [-webkit-background-clip:text] [background-clip:text]">Skills</span>,
              <br />
              Not Money
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Exchange your skills for time credits. Teach Python for an hour, earn credits to get design help.
              A fair economy where everyone's time has equal value.
            </p>
          </div>

          {/* Credit showcase */}
          <div className="flex flex-wrap justify-center gap-4 py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Example:</span>
              <CreditBadge amount={1} />
              <span>= 1 hour of any skill</span>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace">
              <Button size="lg" variant="hero">
                Browse Skills
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
              See How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm text-muted-foreground">Active Traders</div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-credit/10 rounded-xl">
                <Clock className="h-6 w-6 text-credit" />
              </div>
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-sm text-muted-foreground">Hours Exchanged</div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div className="text-2xl font-bold">300+</div>
              <div className="text-sm text-muted-foreground">Skill Categories</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};