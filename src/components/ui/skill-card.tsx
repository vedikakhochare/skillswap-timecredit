import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { CreditBadge } from "./credit-badge";
import { Clock, Star, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Skill } from "@/lib/skillService";

interface SkillCardProps {
  skill: Skill;
}

export const SkillCard = ({ skill }: SkillCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConnect = () => {
    navigate(`/skills/${skill.id}`);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited
        ? "Skill removed from your watchlist."
        : "You'll get notified when this skill becomes available.",
    });
  };
  return (
    <Card
      className="skill-card group cursor-pointer border-border/50 hover:border-primary/20 hover:bg-card-hover"
      onClick={() => navigate(`/skills/${skill.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant="secondary" className="mb-2">
            {skill.category}
          </Badge>
          <div className="flex items-center gap-2">
            <CreditBadge amount={skill.creditsPerHour} variant="small" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent"
              onClick={handleFavorite}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  }`}
              />
            </Button>
          </div>
        </div>
        <h3 className="font-semibold text-lg group-hover:text-primary transition-smooth">
          {skill.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {skill.description}
        </p>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={skill.providerAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"} />
            <AvatarFallback>{skill.providerName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{skill.providerName}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-credit text-credit" />
              <span className="text-xs text-muted-foreground">
                {skill.rating || 0} ({skill.reviewCount || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex justify-between items-center">
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Clock className="h-3 w-3" />
          <span>{skill.availableSlots} slots available</span>
        </div>
        <Button size="sm" variant="default" onClick={handleConnect}>
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};