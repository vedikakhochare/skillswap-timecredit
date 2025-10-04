import { useState, useEffect } from "react";
import { SkillCard } from "@/components/ui/skill-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { getSkills, Skill } from "@/lib/skillService";

// Mock skills for when no real skills are available
const mockSkills: Skill[] = [
  {
    id: "1",
    title: "Python Programming Tutor",
    description: "Learn Python from basics to advanced. I'll help you with syntax, data structures, web frameworks, and more.",
    category: "Programming",
    creditsPerHour: 1,
    providerId: "demo-user-1",
    providerName: "Sarah Chen",
    providerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 4.9,
    reviewCount: 47,
    totalSessions: 150,
    availableSlots: 8,
    responseTime: "< 2 hours",
    bio: "Professional Python developer with 5+ years experience",
    highlights: ["Hands-on coding", "Best practices", "Project guidance"],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: "2",
    title: "UI/UX Design Consultation",
    description: "Get feedback on your designs, learn design principles, and improve your user interface skills.",
    category: "Design",
    creditsPerHour: 1,
    providerId: "demo-user-2",
    providerName: "Marcus Rodriguez",
    providerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    rating: 4.8,
    reviewCount: 33,
    totalSessions: 95,
    availableSlots: 5,
    responseTime: "< 4 hours",
    bio: "Senior UX Designer with expertise in mobile and web design",
    highlights: ["Design feedback", "Process optimization", "Tool mastery"],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: "3",
    title: "Guitar Lessons",
    description: "Learn acoustic or electric guitar. Beginner to intermediate levels welcome. Music theory included.",
    category: "Music",
    creditsPerHour: 1,
    providerId: "demo-user-3",
    providerName: "Alex Johnson",
    providerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    rating: 4.7,
    reviewCount: 52,
    totalSessions: 200,
    availableSlots: 12,
    responseTime: "< 6 hours",
    bio: "Musician and educator with 10+ years teaching experience",
    highlights: ["Beginner friendly", "Music theory", "Song learning"],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

const categories = ["All", "Programming", "Design", "Music", "Language", "Creative", "Business"];

export const MarketplaceSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const fetchedSkills = await getSkills();
        setSkills(fetchedSkills);
      } catch (error) {
        console.error('Error fetching skills:', error);
        // Fallback to mock skills if there's an error
        setSkills(mockSkills);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    const matchesSearch = skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="marketplace" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Discover <span className="text-primary">Skills</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Browse available skills from our community. Find exactly what you need and connect with skilled individuals.
            </p>
          </div>

          {/* Search and filters */}
          <div className="space-y-6 mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className="cursor-pointer transition-smooth hover:opacity-80"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading skills...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}

          {filteredSkills.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No skills found matching your criteria.</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}>
                Clear Filters
              </Button>
            </div>
          )}

          {/* Load more */}
          {filteredSkills.length > 0 && (
            <div className="text-center">
              <Button variant="outline" size="lg">
                <Filter className="mr-2 h-4 w-4" />
                Load More Skills
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};