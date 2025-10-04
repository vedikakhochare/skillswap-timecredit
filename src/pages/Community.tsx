import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  Search, 
  Filter,
  Calendar,
  Award,
  Heart,
  Share2,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  CommunityStats, 
  TopProvider, 
  RecentActivity,
  getCommunityStats,
  getTopProviders,
  getRecentActivities,
  subscribeToCommunityStats,
  subscribeToTopProviders,
  subscribeToRecentActivities,
  searchCommunity
} from "@/lib/communityService";
import { SkillCompatibilityMatrix } from "@/components/ui/skill-compatibility-matrix";
import { LearningPathBuilder } from "@/components/ui/learning-path-builder";
import { formatDistanceToNow } from "date-fns";

// Community stats configuration
const communityStatsConfig = [
  { label: "Active Members", icon: Users, color: "text-primary", key: "activeMembers" as keyof CommunityStats },
  { label: "Skills Taught", icon: Award, color: "text-credit", key: "skillsTaught" as keyof CommunityStats },
  { label: "Sessions Completed", icon: Calendar, color: "text-success", key: "sessionsCompleted" as keyof CommunityStats },
  { label: "Credits Exchanged", icon: TrendingUp, color: "text-warning", key: "creditsExchanged" as keyof CommunityStats }
];

const Community = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Dynamic state
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    activeMembers: 0,
    skillsTaught: 0,
    sessionsCompleted: 0,
    creditsExchanged: 0
  });
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  // Search state
  const [searchResults, setSearchResults] = useState<{
    providers: TopProvider[];
    skills: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      providerName: string;
      providerId: string;
      rating: number;
      creditsPerHour: number;
    }>;
  }>({ providers: [], skills: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load community data
  useEffect(() => {
    const loadCommunityData = async () => {
      setLoading(true);
      
      try {
        // Load initial data
        const [stats, providers, activities] = await Promise.all([
          getCommunityStats(),
          getTopProviders(10),
          getRecentActivities(20)
        ]);

        setCommunityStats(stats);
        setTopProviders(providers);
        setRecentActivities(activities);
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setLoading(false);
        setStatsLoading(false);
        setProvidersLoading(false);
        setActivitiesLoading(false);
      }
    };

    loadCommunityData();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribeStats = subscribeToCommunityStats((stats) => {
      setCommunityStats(stats);
      setStatsLoading(false);
    });

    const unsubscribeProviders = subscribeToTopProviders((providers) => {
      setTopProviders(providers);
      setProvidersLoading(false);
    });

    const unsubscribeActivities = subscribeToRecentActivities((activities) => {
      setRecentActivities(activities);
      setActivitiesLoading(false);
    });

    return () => {
      unsubscribeStats();
      unsubscribeProviders();
      unsubscribeActivities();
    };
  }, []);

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchCommunity(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching community:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            Our <span className="text-primary">Community</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with learners and teachers from around the world. Share knowledge, build skills, and grow together.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {communityStatsConfig.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3`}>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    communityStats[stat.key].toLocaleString()
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search community members, skills, or topics..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {showSearchResults && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Results for "{searchQuery}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchLoading ? (
                <div className="space-y-4">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Skills Results */}
                  {searchResults.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Skills ({searchResults.skills.length})</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.skills.map((skill) => (
                          <Card key={skill.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{skill.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {skill.description}
                              </p>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-primary">{skill.providerName}</span>
                                <span className="text-credit">{skill.creditsPerHour} credits/hr</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                                {skill.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-credit text-credit" />
                                    <span className="text-xs">{skill.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Providers Results */}
                  {searchResults.providers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Providers ({searchResults.providers.length})</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.providers.map((provider) => (
                          <Card key={provider.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10">
                                  {provider.avatar && <AvatarImage src={provider.avatar} />}
                                  <AvatarFallback>{provider.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">{provider.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-credit text-credit" />
                                    <span className="text-sm">{provider.rating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({provider.sessions} sessions)</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {provider.skills.slice(0, 3).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {provider.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{provider.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {provider.credits} credits earned
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.skills.length === 0 && searchResults.providers.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                      <p className="text-muted-foreground">
                        Try searching for different keywords or check your spelling.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="providers">Top Providers</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Top Providers Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-credit" />
                    Top Providers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {providersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                          <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : topProviders.length > 0 ? (
                    <>
                      {topProviders.slice(0, 3).map((provider) => (
                        <div key={provider.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-12 w-12">
                            {provider.avatar && <AvatarImage src={provider.avatar} />}
                            <AvatarFallback>{provider.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{provider.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-credit text-credit" />
                                {provider.rating.toFixed(1)}
                              </span>
                              <span>{provider.sessions} sessions</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={() => setSelectedTab("providers")}>
                        View All Providers
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No providers found</p>
                      <p className="text-sm">Be the first to share your skills!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivities.length > 0 ? (
                    <>
                      {recentActivities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-8 w-8">
                            {activity.userAvatar && <AvatarImage src={activity.userAvatar} />}
                            <AvatarFallback>{activity.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.userName}</span> {activity.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {activity.skillTitle && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.skillTitle}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={() => setSelectedTab("activity")}>
                        View All Activity
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Start learning or teaching to see activity!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Be Respectful</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Treat all members with kindness and respect</li>
                      <li>• Use inclusive language and be welcoming</li>
                      <li>• Provide constructive feedback</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Share Quality</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Offer genuine, helpful knowledge</li>
                      <li>• Be honest about your skill level</li>
                      <li>• Show up on time for sessions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            {providersLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="group">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 bg-muted animate-pulse rounded-full mx-auto" />
                        <div className="space-y-2">
                          <div className="h-5 w-24 bg-muted animate-pulse rounded mx-auto" />
                          <div className="h-4 w-20 bg-muted animate-pulse rounded mx-auto" />
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
                        <div className="h-8 w-full bg-muted animate-pulse rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : topProviders.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topProviders.map((provider) => (
                  <Card key={provider.id} className="group hover:shadow-card transition-smooth">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <Avatar className="h-16 w-16 mx-auto">
                          {provider.avatar && <AvatarImage src={provider.avatar} />}
                          <AvatarFallback className="text-lg">{provider.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{provider.name}</h3>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-credit text-credit" />
                            <span className="text-sm">{provider.rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({provider.sessions} sessions)</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {provider.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Credits Earned</span>
                          <span className="font-medium">{provider.credits}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Providers Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share your skills with the community!
                </p>
                {user ? (
                  <Link to="/post-skill">
                    <Button>Share Your Skills</Button>
                  </Link>
                ) : (
                  <Link to="/signup">
                    <Button>Join Community</Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          {activity.userAvatar && <AvatarImage src={activity.userAvatar} />}
                          <AvatarFallback>{activity.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{activity.userName} {activity.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.skillTitle && (
                              <Badge variant="outline">{activity.skillTitle}</Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground mb-6">
                  Start learning or teaching to see community activity!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user ? (
                    <>
                      <Link to="/post-skill">
                        <Button>Share Your Skills</Button>
                      </Link>
                      <Link to="/marketplace">
                        <Button variant="outline">Browse Skills</Button>
                      </Link>
                    </>
                  ) : (
                    <Link to="/signup">
                      <Button>Join Community</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-tools" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <SkillCompatibilityMatrix />
              <LearningPathBuilder />
            </div>
          </TabsContent>

          <TabsContent value="discussions" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">Community Discussions</h3>
                  <p className="text-muted-foreground">
                    Join conversations about skills, learning tips, and community updates.
                  </p>
                  <Button>
                    Start a Discussion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-semibold mb-4">Ready to Join Our Community?</h3>
            <p className="text-muted-foreground mb-6">
              Connect with like-minded learners and teachers. Share your expertise and learn new skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/post-skill">
                    <Button size="lg">
                      Share Your Skills
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="outline" size="lg">
                      Browse Skills
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">
                      Join Community
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="outline" size="lg">
                      Explore Skills
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Community;
