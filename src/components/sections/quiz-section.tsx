import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Trophy, 
  Clock, 
  Star, 
  Target, 
  Zap,
  BookOpen,
  TrendingUp,
  Users,
  Award,
  ChevronRight,
  Play
} from "lucide-react";

const programmingLanguages = [
  { name: 'JavaScript', icon: '🟨', difficulty: 'Beginner to Advanced', questions: 50 },
  { name: 'Python', icon: '🐍', difficulty: 'Beginner to Advanced', questions: 45 },
  { name: 'React', icon: '⚛️', difficulty: 'Intermediate to Advanced', questions: 40 },
  { name: 'TypeScript', icon: '🔷', difficulty: 'Intermediate to Advanced', questions: 35 },
  { name: 'Java', icon: '☕', difficulty: 'Beginner to Advanced', questions: 50 },
  { name: 'C++', icon: '⚡', difficulty: 'Intermediate to Advanced', questions: 40 },
  { name: 'Go', icon: '🐹', difficulty: 'Intermediate to Advanced', questions: 30 },
  { name: 'Rust', icon: '🦀', difficulty: 'Advanced', questions: 25 },
  { name: 'Swift', icon: '🍎', difficulty: 'Intermediate to Advanced', questions: 30 },
  { name: 'AI/ML', icon: '🤖', difficulty: 'Beginner to Advanced', questions: 35 }
];

const features = [
  {
    icon: Brain,
    title: "Comprehensive Database",
    description: "Over 300+ carefully crafted questions across 10+ programming languages"
  },
  {
    icon: Target,
    title: "Adaptive Difficulty",
    description: "Questions tailored to your skill level with beginner, intermediate, and advanced options"
  },
  {
    icon: Trophy,
    title: "Achievement System",
    description: "Earn badges, track streaks, and climb the leaderboard as you improve"
  },
  {
    icon: Clock,
    title: "Timed Challenges",
    description: "Test your knowledge under pressure with realistic time limits"
  }
];

const stats = [
  { label: "Programming Languages", value: "10+", icon: BookOpen },
  { label: "Total Questions", value: "300+", icon: Brain },
  { label: "Active Learners", value: "1,200+", icon: Users },
  { label: "Average Score", value: "85%", icon: TrendingUp }
];

export const QuizSection = () => {
  return (
    <section id="quiz" className="py-20 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold">
                Programming <span className="text-primary">Quiz Challenge</span>
              </h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Test your programming knowledge with our comprehensive quiz database. 
              Choose from 10+ languages and challenge yourself with adaptive difficulty levels.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Programming Languages */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">Available Programming Languages</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {programmingLanguages.map((lang, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{lang.icon}</div>
                    <h4 className="font-semibold mb-1">{lang.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{lang.difficulty}</p>
                    <Badge variant="secondary" className="text-xs">
                      {lang.questions} questions
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">Ready to Test Your Skills?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of developers who are improving their programming knowledge 
                  through our comprehensive quiz system.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="px-8">
                    <Link to="/quiz">
                      <Play className="h-5 w-5 mr-2" />
                      Start Quiz Challenge
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8">
                    <Link to="/marketplace">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Explore Marketplace
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Earn Badges</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unlock achievements and badges as you complete quizzes and improve your scores.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Track Progress</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Monitor your improvement with detailed statistics and personalized insights.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Compete Globally</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  See how you rank against other developers on our global leaderboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

