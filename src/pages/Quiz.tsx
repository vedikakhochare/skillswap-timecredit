import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Clock, 
  Trophy, 
  Star, 
  Play, 
  CheckCircle, 
  XCircle,
  Award,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Users,
  Timer,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  generateQuiz, 
  submitQuizAttempt, 
  getUserQuizStats, 
  getUserBadges,
  getLeaderboard,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  UserQuizStats,
  Badge as QuizBadge,
  LeaderboardEntry
} from "@/lib/quizService";

// Programming languages available for quizzes
const programmingLanguages = [
  { name: 'JavaScript', icon: '🟨', description: 'Web development and beyond' },
  { name: 'Python', icon: '🐍', description: 'Data science and automation' },
  { name: 'React', icon: '⚛️', description: 'Frontend development' },
  { name: 'TypeScript', icon: '🔷', description: 'Type-safe JavaScript' },
  { name: 'Java', icon: '☕', description: 'Enterprise applications' },
  { name: 'C++', icon: '⚡', description: 'System programming' },
  { name: 'Go', icon: '🐹', description: 'Cloud and microservices' },
  { name: 'Rust', icon: '🦀', description: 'Memory-safe systems' },
  { name: 'Swift', icon: '🍎', description: 'iOS and macOS development' },
  { name: 'AI/ML', icon: '🤖', description: 'Artificial Intelligence' }
];

const difficultyLevels = [
  { level: 'beginner', label: 'Beginner', color: 'bg-green-500', description: 'Perfect for getting started' },
  { level: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500', description: 'For those with some experience' },
  { level: 'advanced', label: 'Advanced', color: 'bg-red-500', description: 'Challenge yourself' }
];

const Quiz = () => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalQuestions: number;
    creditsEarned: number;
    timeSpent: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserQuizStats | null>(null);
  const [userBadges, setUserBadges] = useState<QuizBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load user stats for the selected language
      if (selectedLanguage) {
        const stats = await getUserQuizStats(user.uid, selectedLanguage);
        setUserStats(stats);
      }
      
      // Load user badges
      const badges = await getUserBadges(user.uid);
      setUserBadges(badges);
      
      // Load leaderboard
      const leaderboardData = await getLeaderboard(10);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizStarted && timeRemaining > 0 && !quizCompleted) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timeRemaining, quizCompleted]);

  const startQuiz = async () => {
    if (!selectedLanguage || !user) return;
    
    setLoading(true);
    try {
      const quiz = await generateQuiz(
        selectedLanguage.toLowerCase(),
        selectedLanguage,
        selectedDifficulty,
        user.uid
      );
      
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);
      setUserAnswers(new Array(quiz.questions.length).fill(-1));
      setTimeRemaining(quiz.timeLimit! * 60); // Convert minutes to seconds
      setQuizStarted(true);
      setQuizCompleted(false);
      setQuizResult(null);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuiz || quizCompleted) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuizSubmit = async () => {
    if (!currentQuiz || !user || quizCompleted) return;
    
    setQuizCompleted(true);
    setQuizStarted(false);
    
    // Calculate score
    let correctAnswers = 0;
    currentQuiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
    const creditsEarned = Math.round(currentQuiz.totalCredits * (score / 100));
    const timeSpent = (currentQuiz.timeLimit! * 60) - timeRemaining;
    
    const result = {
      score,
      totalQuestions: currentQuiz.questions.length,
      creditsEarned,
      timeSpent
    };
    
    setQuizResult(result);
    
    // Submit quiz attempt
    try {
      await submitQuizAttempt({
        userId: user.uid,
        quizId: currentQuiz.id!,
        answers: userAnswers,
        score,
        totalQuestions: currentQuiz.questions.length,
        timeSpent,
        creditsEarned
      });
      
      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTimeRemaining(0);
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuizResult(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! 🎉';
    if (score >= 80) return 'Great job! 👏';
    if (score >= 60) return 'Good effort! 👍';
    return 'Keep practicing! 💪';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Quiz Section</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please log in to access the quiz section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Brain className="h-10 w-10 text-primary" />
              Programming Quiz Challenge
            </h1>
            <p className="text-xl text-muted-foreground">
              Test your programming knowledge with our comprehensive quiz database
            </p>
          </div>

          <Tabs defaultValue="quiz" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quiz">Take Quiz</TabsTrigger>
              <TabsTrigger value="stats">My Stats</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="space-y-8">
              {!quizStarted && !currentQuiz && (
                <div className="space-y-8">
                  {/* Language Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Choose Your Programming Language
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {programmingLanguages.map((lang) => (
                          <Button
                            key={lang.name}
                            variant={selectedLanguage === lang.name ? "default" : "outline"}
                            className="h-auto p-4 flex flex-col items-center gap-2"
                            onClick={() => setSelectedLanguage(lang.name)}
                          >
                            <span className="text-2xl">{lang.icon}</span>
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-xs text-muted-foreground text-center">
                              {lang.description}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Difficulty Selection */}
                  {selectedLanguage && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Select Difficulty Level
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {difficultyLevels.map((level) => (
                            <Button
                              key={level.level}
                              variant={selectedDifficulty === level.level ? "default" : "outline"}
                              className="h-auto p-6 flex flex-col items-center gap-3"
                              onClick={() => setSelectedDifficulty(level.level as any)}
                            >
                              <div className={`w-4 h-4 rounded-full ${level.color}`} />
                              <span className="font-medium">{level.label}</span>
                              <span className="text-sm text-muted-foreground text-center">
                                {level.description}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Start Quiz Button */}
                  {selectedLanguage && (
                    <div className="text-center">
                      <Button
                        size="lg"
                        onClick={startQuiz}
                        disabled={loading}
                        className="px-8 py-4 text-lg"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Generating Quiz...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Quiz
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Interface */}
              {currentQuiz && quizStarted && !quizCompleted && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {currentQuiz.title}
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Timer className="h-4 w-4" />
                          <span className="font-mono">{formatTime(timeRemaining)}</span>
                        </div>
                        <Badge variant="outline">
                          Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100} 
                      className="w-full"
                    />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        {currentQuiz.questions[currentQuestionIndex].question}
                      </h3>
                      <div className="space-y-3">
                        {currentQuiz.questions[currentQuestionIndex].options.map((option, index) => (
                          <Button
                            key={index}
                            variant={userAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                            className="w-full justify-start h-auto p-4 text-left"
                            onClick={() => handleAnswerSelect(index)}
                          >
                            <span className="font-medium mr-3">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextQuestion}
                        disabled={userAnswers[currentQuestionIndex] === -1}
                      >
                        {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Submit Quiz' : 'Next'}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz Results */}
              {quizCompleted && quizResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Quiz Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className={`text-6xl font-bold ${getScoreColor(quizResult.score)}`}>
                        {quizResult.score}%
                      </div>
                      <div className="text-xl font-medium">
                        {getScoreMessage(quizResult.score)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{Math.round(quizResult.score / 20)}/{quizResult.totalQuestions} Correct</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{formatTime(quizResult.timeSpent)}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <span>{quizResult.creditsEarned} Credits</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <Button onClick={resetQuiz} variant="outline">
                        Take Another Quiz
                      </Button>
                      <Button onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Different Language
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Your Quiz Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{userStats.totalQuizzes}</div>
                        <div className="text-sm text-muted-foreground">Quizzes Taken</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{userStats.averageScore}%</div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600">{userStats.currentStreak}</div>
                        <div className="text-sm text-muted-foreground">Current Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{userStats.totalCreditsEarned}</div>
                        <div className="text-sm text-muted-foreground">Credits Earned</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No quiz statistics yet. Take your first quiz!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Your Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userBadges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userBadges.map((badge) => (
                        <div key={badge.id} className="flex items-center gap-3 p-4 border rounded-lg">
                          <span className="text-2xl">{badge.icon}</span>
                          <div>
                            <div className="font-medium">{badge.badgeName}</div>
                            <div className="text-sm text-muted-foreground">{badge.description}</div>
                            <div className="text-xs text-muted-foreground">
                              Earned {new Date(badge.earnedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No badges earned yet. Start taking quizzes!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.userId} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">#{entry.rank}</div>
                        <div className="flex-1">
                          <div className="font-medium">{entry.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.totalCredits} credits • {entry.totalQuizzes} quizzes • {entry.averageScore}% avg
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{entry.currentStreak} day streak</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Quiz;

