import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Star, MessageCircle, Calendar } from "lucide-react";
import { Review, getSkillReviews } from "@/lib/skillService";
import { formatDistanceToNow } from "date-fns";

interface ReviewDisplayProps {
    skillId: string;
    limit?: number;
    showHeader?: boolean;
}

export const ReviewDisplay = ({ skillId, limit = 10, showHeader = true }: ReviewDisplayProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const fetchedReviews = await getSkillReviews(skillId, limit);
                setReviews(fetchedReviews);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [skillId, limit]);

    if (loading) {
        return (
            <div className="space-y-4">
                {showHeader && (
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Reviews</h3>
                    </div>
                )}
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 bg-muted rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/4" />
                                        <div className="h-3 bg-muted rounded w-1/6" />
                                        <div className="h-3 bg-muted rounded w-full" />
                                        <div className="h-3 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="space-y-4">
                {showHeader && (
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Reviews</h3>
                    </div>
                )}
                <Card>
                    <CardContent className="p-8 text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                        <p className="text-muted-foreground">
                            Be the first to leave a review for this skill!
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
                </div>
            )}

            <div className="space-y-3">
                {reviews.map((review) => (
                    <Card key={review.id} className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerId}`} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-4 w-4 ${star <= review.rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-muted-foreground'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {review.rating}/5
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {review.comment && (
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
