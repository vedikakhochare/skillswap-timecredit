import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Search, Filter, Star, Clock, Users, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { getSkills, Skill } from "@/lib/skillService";
import { useAuth } from "@/hooks/useAuth";

const Marketplace = () => {
    const navigate = useNavigate();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [priceRange, setPriceRange] = useState("All");
    const { user } = useAuth();

    const categories = [
        "All", "Programming", "Design", "Marketing", "Writing",
        "Music", "Language", "Fitness", "Consulting", "Creative", "Business"
    ];

    const sortOptions = [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "price-low", label: "Price: Low to High" },
        { value: "price-high", label: "Price: High to Low" },
        { value: "rating", label: "Highest Rated" },
        { value: "sessions", label: "Most Sessions" }
    ];

    const priceRanges = [
        "All", "1 credit", "2 credits", "3 credits", "4+ credits"
    ];

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const fetchedSkills = await getSkills();
            setSkills(fetchedSkills);
            setFilteredSkills(fetchedSkills);
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    useEffect(() => {
        let filtered = [...skills];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(skill =>
                skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== "All") {
            filtered = filtered.filter(skill => skill.category === selectedCategory);
        }

        // Filter by price range
        if (priceRange !== "All") {
            const price = parseInt(priceRange.split(' ')[0]);
            if (priceRange.includes('+')) {
                filtered = filtered.filter(skill => skill.creditsPerHour >= price);
            } else {
                filtered = filtered.filter(skill => skill.creditsPerHour === price);
            }
        }

        // Sort skills
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "price-low":
                    return a.creditsPerHour - b.creditsPerHour;
                case "price-high":
                    return b.creditsPerHour - a.creditsPerHour;
                case "rating":
                    return (b.rating || 0) - (a.rating || 0);
                case "sessions":
                    return (b.totalSessions || 0) - (a.totalSessions || 0);
                default:
                    return 0;
            }
        });

        setFilteredSkills(filtered);
    }, [skills, searchQuery, selectedCategory, sortBy, priceRange]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setSortBy("newest");
        setPriceRange("All");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Loading marketplace...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-4xl font-bold flex-1 text-center">
                            Discover <span className="text-primary">Skills</span>
                        </h1>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSkills}
                            disabled={loading}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Browse and book skills from our talented community. Learn something new or share your expertise.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{skills.length}</div>
                            <div className="text-sm text-muted-foreground">Total Skills</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{categories.length - 1}</div>
                            <div className="text-sm text-muted-foreground">Categories</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">
                                {skills.reduce((sum, skill) => sum + (skill.totalSessions || 0), 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sessions</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">
                                {new Set(skills.map(skill => skill.providerId)).size}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Providers</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Posted Skills Notice */}
                {skills.length > 0 && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                            <p className="text-sm text-success">
                                <strong>{skills.length}</strong> {skills.length === 1 ? 'skill has' : 'skills have'} been posted by our community members.
                                Browse and book sessions with real experts!
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters and Search */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search skills..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Category Filter */}
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Price Range */}
                            <Select value={priceRange} onValueChange={setPriceRange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Price Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    {priceRanges.map((range) => (
                                        <SelectItem key={range} value={range}>
                                            {range}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Sort */}
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Clear Filters */}
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold">
                            {filteredSkills.length} {filteredSkills.length === 1 ? 'Skill' : 'Skills'} Found
                        </h2>
                        <p className="text-muted-foreground">
                            {searchQuery && `Searching for "${searchQuery}"`}
                            {selectedCategory !== "All" && ` in ${selectedCategory}`}
                        </p>
                    </div>

                    {!user && (
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">Want to book skills?</p>
                            <Link to="/signup">
                                <Button size="sm">Sign Up Free</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Skills Grid */}
                {filteredSkills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSkills.map((skill) => (
                            <Card key={skill.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                                <Link to={`/skills/${skill.id}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {skill.category}
                                            </Badge>
                                            <CreditBadge amount={skill.creditsPerHour} variant="small" />
                                        </div>
                                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                            {skill.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                            {skill.description}
                                        </p>

                                        {/* Provider Info */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={skill.providerAvatar} />
                                                <AvatarFallback className="text-xs">
                                                    {skill.providerName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{skill.providerName}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-credit text-credit" />
                                                        <span>{skill.rating || 0}</span>
                                                    </div>
                                                    <span>•</span>
                                                    <span>{skill.reviewCount || 0} reviews</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                <span>{skill.totalSessions || 0} sessions</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{skill.availableSlots} slots</span>
                                            </div>
                                        </div>

                                        {/* Highlights */}
                                        {skill.highlights && skill.highlights.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {skill.highlights.slice(0, 2).map((highlight, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {highlight}
                                                    </Badge>
                                                ))}
                                                {skill.highlights.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{skill.highlights.length - 2} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2">No skills found</h3>
                        <p className="text-muted-foreground mb-4">
                            {skills.length === 0
                                ? "Be the first to share your expertise! Post a skill and help build our community."
                                : "Try adjusting your search criteria or browse all skills."
                            }
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" onClick={clearFilters}>
                                Clear All Filters
                            </Button>
                            {skills.length === 0 && user && (
                                <Button onClick={() => navigate('/post-skill')}>
                                    Post Your First Skill
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Load More */}
                {filteredSkills.length > 0 && (
                    <div className="text-center mt-12">
                        <Button variant="outline" size="lg">
                            Load More Skills
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Marketplace;
