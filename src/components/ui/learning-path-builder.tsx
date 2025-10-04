import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  Clock, 
  Target, 
  BookOpen, 
  CheckCircle2,
  Edit3,
  Save,
  X,
  Zap,
  Star,
  Users
} from "lucide-react";
import { 
  LearningPath, 
  SkillRecommendation,
  getSkillRecommendations,
  generateLearningPaths
} from "@/lib/aiSkillService";
import { useAuth } from "@/hooks/useAuth";

interface LearningPathBuilderProps {
  className?: string;
  onPathCreated?: (path: LearningPath) => void;
}

export const LearningPathBuilder = ({ className, onPathCreated }: LearningPathBuilderProps) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newPath, setNewPath] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    goals: [] as string[],
    skills: [] as SkillRecommendation[]
  });
  const [availableSkills, setAvailableSkills] = useState<SkillRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState("");
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    if (user && isCreating) {
      loadAvailableSkills();
    }
  }, [user, isCreating]);

  const loadAvailableSkills = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const skills = await getSkillRecommendations(user.uid, 20);
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = () => {
    if (!newPath.title || !newPath.description || newPath.skills.length === 0) {
      return;
    }

    const totalDuration = newPath.skills.reduce((sum, skill) => sum + skill.estimatedTime, 0);
    const estimatedCompletion = Math.ceil(totalDuration / 5); // Assuming 5 hours per week

    const learningPath: LearningPath = {
      id: `custom-${Date.now()}`,
      title: newPath.title,
      description: newPath.description,
      skills: newPath.skills,
      totalDuration,
      difficulty: newPath.difficulty,
      category: newPath.category,
      estimatedCompletion,
      prerequisites: [],
      outcomes: newPath.goals
    };

    onPathCreated?.(learningPath);
    resetForm();
  };

  const resetForm = () => {
    setNewPath({
      title: "",
      description: "",
      category: "",
      difficulty: "beginner",
      goals: [],
      skills: []
    });
    setIsCreating(false);
    setEditingGoal("");
    setNewGoal("");
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setNewPath(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }));
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setNewPath(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addSkill = (skill: SkillRecommendation) => {
    if (!newPath.skills.some(s => s.skill.id === skill.skill.id)) {
      setNewPath(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillId: string) => {
    setNewPath(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.skill.id !== skillId)
    }));
  };

  const moveSkill = (fromIndex: number, toIndex: number) => {
    const newSkills = [...newPath.skills];
    const [movedSkill] = newSkills.splice(fromIndex, 1);
    newSkills.splice(toIndex, 0, movedSkill);
    setNewPath(prev => ({
      ...prev,
      skills: newSkills
    }));
  };

  if (!isCreating) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Create Custom Learning Path</h3>
              <p className="text-muted-foreground mb-4">
                Build your own personalized learning journey with AI-powered skill recommendations
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start Building
              </Button>
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
          <Edit3 className="h-6 w-6 text-primary" />
          Learning Path Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Path Title</Label>
              <Input
                id="title"
                placeholder="e.g., Full-Stack Web Development"
                value={newPath.title}
                onChange={(e) => setNewPath(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Programming"
                value={newPath.category}
                onChange={(e) => setNewPath(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what learners will achieve in this path..."
              value={newPath.description}
              onChange={(e) => setNewPath(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select
              value={newPath.difficulty}
              onValueChange={(value: "beginner" | "intermediate" | "advanced") => 
                setNewPath(prev => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Learning Goals */}
        <div className="space-y-4">
          <Label>Learning Goals</Label>
          <div className="space-y-2">
            {newPath.goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="flex-1 text-sm">{goal}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGoal(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add a learning goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              />
              <Button onClick={addGoal} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Skills Selection */}
        <div className="space-y-4">
          <Label>Skills in this Path</Label>
          
          {/* Selected Skills */}
          {newPath.skills.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Drag to reorder skills in your preferred learning sequence
              </div>
              {newPath.skills.map((skillRec, index) => (
                <div key={skillRec.skill.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{skillRec.skill.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {skillRec.estimatedTime}h • {skillRec.difficulty} • {Math.round(skillRec.score * 100)}% match
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSkill(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSkill(index, Math.min(newPath.skills.length - 1, index + 1))}
                      disabled={index === newPath.skills.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(skillRec.skill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Available Skills */}
          <div className="space-y-2">
            <Label>Add Skills</Label>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {availableSkills
                  .filter(skill => !newPath.skills.some(s => s.skill.id === skill.skill.id))
                  .map((skillRec) => (
                    <div key={skillRec.skill.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSkill(skillRec)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Path Summary */}
        {newPath.skills.length > 0 && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <BookOpen className="h-4 w-4" />
              Path Summary
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Duration</div>
                <div className="font-medium">
                  {newPath.skills.reduce((sum, skill) => sum + skill.estimatedTime, 0)}h
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Skills</div>
                <div className="font-medium">{newPath.skills.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Difficulty</div>
                <div className="font-medium capitalize">{newPath.difficulty}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Est. Completion</div>
                <div className="font-medium">
                  {Math.ceil(newPath.skills.reduce((sum, skill) => sum + skill.estimatedTime, 0) / 5)} days
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleCreatePath} disabled={!newPath.title || newPath.skills.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Create Path
          </Button>
          <Button variant="outline" onClick={resetForm}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
