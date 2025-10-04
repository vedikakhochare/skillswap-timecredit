import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createSkill } from "@/lib/skillService";

const PostSkill = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [creditsPerHour, setCreditsPerHour] = useState("1");
  const [availableSlots, setAvailableSlots] = useState("5");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    "Programming",
    "Design",
    "Marketing",
    "Writing",
    "Music",
    "Language",
    "Fitness",
    "Consulting",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post a skill.",
        variant: "destructive",
      });
      return;
    }

    // Basic client-side validation for clearer errors
    if (!title.trim() || !description.trim() || !category.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide a title, description, and select a category.",
        variant: "destructive",
      });
      return;
    }

    const parsedCredits = parseInt(creditsPerHour);
    const parsedSlots = parseInt(availableSlots);
    if (Number.isNaN(parsedCredits) || parsedCredits < 1) {
      toast({
        title: "Invalid Credits",
        description: "Credits per hour must be a number greater than or equal to 1.",
        variant: "destructive",
      });
      return;
    }
    if (Number.isNaN(parsedSlots) || parsedSlots < 1) {
      toast({
        title: "Invalid Slots",
        description: "Available slots per week must be a number greater than or equal to 1.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Log payload for debugging permission errors
      const payload = {
        title,
        description,
        category,
        creditsPerHour: parsedCredits,
        availableSlots: parsedSlots,
        providerId: user.uid,
        providerName: user.displayName || 'Anonymous',
        providerAvatar: user.photoURL || undefined,
        rating: 0,
        reviewCount: 0,
        totalSessions: 0,
        responseTime: "< 24 hours",
        bio: `Expert in ${category.toLowerCase()}`,
        highlights: [
          "Professional guidance",
          "Flexible scheduling",
          "Hands-on learning",
          "Personalized approach"
        ]
      };
      console.log('[PostSkill] Creating skill with payload:', { providerUid: user.uid, payload });

      await createSkill(payload);

      toast({
        title: "Skill Posted Successfully! 🎉",
        description: "Your skill is now live on the marketplace. Start earning time credits!",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error('Error creating skill:', error);
      toast({
        title: "Error Posting Skill",
        description: error?.message || "There was an error posting your skill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Post Your Skill</CardTitle>
            <CardDescription>
              Share your expertise and start earning time credits by helping others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Skill Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Python Programming for Beginners"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you'll teach, your experience, and what students can expect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Credits per Hour *</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={creditsPerHour}
                    onChange={(e) => setCreditsPerHour(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    1 credit = 1 hour of your time
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slots">Available Slots per Week *</Label>
                <Input
                  id="slots"
                  type="number"
                  min="1"
                  max="50"
                  value={availableSlots}
                  onChange={(e) => setAvailableSlots(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How many sessions can you offer weekly?
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">💡 Tips for Success</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be specific about what you offer</li>
                  <li>• Set realistic availability</li>
                  <li>• Respond promptly to connection requests</li>
                  <li>• Build your reputation through quality sessions</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Posting Skill..." : "Post Skill"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PostSkill;
