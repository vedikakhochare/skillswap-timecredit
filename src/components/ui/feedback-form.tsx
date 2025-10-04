import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Star, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addReview, Review } from "@/lib/skillService";

interface FeedbackFormProps {
    bookingId: string;
    skillId: string;
    providerId: string;
    providerName: string;
    skillTitle: string;
    reviewerId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const FeedbackForm = ({
    bookingId,
    skillId,
    providerId,
    providerName,
    skillTitle,
    reviewerId,
    onClose,
    onSuccess
}: FeedbackFormProps) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast({
                title: "Rating Required",
                description: "Please select a rating before submitting your feedback.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await addReview({
                bookingId,
                skillId,
                providerId,
                reviewerId,
                rating,
                comment: comment.trim() || undefined,
            });

            toast({
                title: "Feedback Submitted! 🎉",
                description: `Thank you for your feedback on ${skillTitle}.`,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingLabels = [
        "Poor",
        "Fair",
        "Good",
        "Very Good",
        "Excellent"
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Leave Feedback</CardTitle>
                        <CardDescription>
                            Rate your session with {providerName}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label className="text-sm font-medium mb-3 block">
                                How was your session? *
                            </Label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                    >
                                        <Star
                                            className={`h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-muted-foreground hover:text-yellow-400'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    {ratingLabels[rating - 1]}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="comment" className="text-sm font-medium mb-3 block">
                                Additional Comments (Optional)
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Share your experience with this session..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[100px]"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {comment.length}/500 characters
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Feedback
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
