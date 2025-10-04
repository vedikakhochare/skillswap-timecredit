import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  Users, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  CheckCircle2,
  Lightbulb,
  Calendar
} from "lucide-react";
import { 
  SkillRecommendation, 
  LearningPath, 
  UserSkillProfile,
  getSkillRecommendations,
  generateLearningPaths,
  generateUserSkillProfile
} from "@/lib/aiSkillService";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface AISkillDashboardProps {
  className?: string;
}

export const AISkillDashboard = ({ className }: AISkillDashboardProps) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [userProfile, setUserProfile] = useState<UserSkillProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommendations");

  useEffect(() => {
    if (!user) return;

    const loadAIData = async () => {
      setLoading(true);
      try {
        const [profile, recs, paths] = await Promise.all([
          generateUserSkillProfile(user.uid),
          getSkillRecommendations(user.uid, 8),
          generateLearningPaths(user.uid)
        ]);

        setUserProfile(profile);
        setRecommendations(recs);
        setLearningPaths(paths);
      } catch (error) {
        console.error('Error loading AI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAIData();
  }, [user]);

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Learning</h3>
          <p className="text-muted-foreground">Sign in to get personalized skill recommendations</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <CardTitle>AI Learning Assistant</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
        {userProfile && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Level: {userProfile.experienceLevel}</span>
            <span>•</span>
            <span>{userProfile.completedSessions} sessions completed</span>
            <span>•</span>
            <span>{userProfile.availableTime}h/week available</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <Card key={rec.skill.id} className="group hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{rec.skill.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {rec.skill.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {Math.round(rec.score * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Compatibility Score */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Compatibility</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={rec.compatibility * 100} 
                            className="w-16 h-2" 
                          />
                          <span className="font-medium">
                            {Math.round(rec.compatibility * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Difficulty & Time */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={rec.difficulty === 'beginner' ? 'default' : 
                                   rec.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                          >
                            {rec.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{rec.estimatedTime}h</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3 fill-credit text-credit" />
                          <span>{rec.skill.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="space-y-1">
                        {rec.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Prerequisites */}
                      {rec.prerequisites.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <BookOpen className="h-3 w-3" />
                            <span>Prerequisites:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rec.prerequisites.slice(0, 2).map((prereq) => (
                              <Badge key={prereq} variant="outline" className="text-xs">
                                {prereq}
                              </Badge>
                            ))}
                            {rec.prerequisites.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{rec.prerequisites.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Button className="w-full group-hover:bg-primary/90 transition-colors">
                        Start Learning
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {recommendations.length === 0 && (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-muted-foreground">
                  Complete your profile to get personalized skill recommendations
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="learning-paths" className="space-y-4">
            <div className="space-y-4">
              {learningPaths.map((path) => (
                <Card key={path.id} className="group hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-xl">{path.title}</h4>
                          <Badge 
                            variant={path.difficulty === 'beginner' ? 'default' : 
                                   path.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                          >
                            {path.difficulty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{path.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{path.totalDuration}h total</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{path.estimatedCompletion} days</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{path.skills.length} skills</span>
                          </div>
                        </div>
                      </div>
                      <Button className="group-hover:bg-primary/90 transition-colors">
                        Start Path
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    {/* Skills in this path */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">Skills in this path:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {path.skills.slice(0, 4).map((skillRec, index) => (
                          <div key={skillRec.skill.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{skillRec.skill.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {skillRec.estimatedTime}h • {skillRec.difficulty}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium">
                                {Math.round(skillRec.score * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                        {path.skills.length > 4 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              +
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {path.skills.length - 4} more skills
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Learning outcomes */}
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">What you'll learn:</h5>
                      <div className="space-y-1">
                        {path.outcomes.map((outcome, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>{outcome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {learningPaths.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Learning Paths Available</h3>
                <p className="text-muted-foreground">
                  Complete some skills to unlock personalized learning paths
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
