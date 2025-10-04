import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Link, 
  TrendingUp, 
  Users, 
  Target,
  ArrowRight,
  Lightbulb,
  Zap
} from "lucide-react";
import { 
  SkillCompatibility, 
  getSkillCompatibility,
  getSkillCategories 
} from "@/lib/aiSkillService";

interface SkillCompatibilityMatrixProps {
  className?: string;
}

export const SkillCompatibilityMatrix = ({ className }: SkillCompatibilityMatrixProps) => {
  const [compatibility, setCompatibility] = useState<SkillCompatibility[]>([]);
  const [categories, setCategories] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [compData, catData] = await Promise.all([
          getSkillCompatibility(),
          getSkillCategories()
        ]);
        setCompatibility(compData);
        setCategories(catData);
      } catch (error) {
        console.error('Error loading compatibility data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredCompatibility = compatibility.filter(comp => {
    const matchesSearch = searchQuery === "" || 
      comp.skill1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.skill2.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.useCase.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || 
      (categories[selectedCategory] && 
       (categories[selectedCategory].skills.includes(comp.skill1) ||
        categories[selectedCategory].skills.includes(comp.skill2)));
    
    return matchesSearch && matchesCategory;
  });

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-50";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-50";
    if (score >= 0.4) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Fair";
    return "Poor";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
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
        <CardTitle className="flex items-center gap-2">
          <Link className="h-6 w-6 text-primary" />
          Skill Compatibility Matrix
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Discover which skills work well together and create powerful combinations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills or use cases..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={selectedCategory === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("All")}
            >
              All
            </Button>
            {Object.keys(categories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Compatibility Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompatibility.map((comp, index) => (
            <Card key={index} className="group hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Skills */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {comp.skill1}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-sm">
                        {comp.skill2}
                      </Badge>
                    </div>
                    <Badge 
                      className={`text-xs font-medium ${getCompatibilityColor(comp.compatibility)}`}
                    >
                      {getCompatibilityLabel(comp.compatibility)}
                    </Badge>
                  </div>

                  {/* Compatibility Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Compatibility</span>
                      <span className="font-medium">
                        {Math.round(comp.compatibility * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          comp.compatibility >= 0.8 ? 'bg-green-500' :
                          comp.compatibility >= 0.6 ? 'bg-yellow-500' :
                          comp.compatibility >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${comp.compatibility * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lightbulb className="h-3 w-3" />
                      <span>Why they work together:</span>
                    </div>
                    <p className="text-sm">{comp.reason}</p>
                  </div>

                  {/* Use Case */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span>Best for:</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {comp.useCase}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <Button 
                    size="sm" 
                    className="w-full group-hover:bg-primary/90 transition-colors"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Learn Together
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredCompatibility.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
            <p className="text-muted-foreground">
              Try searching for different skills or selecting a different category
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {compatibility.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Skill Combinations
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {compatibility.filter(c => c.compatibility >= 0.8).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Excellent Matches
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(categories).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Skill Categories
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
