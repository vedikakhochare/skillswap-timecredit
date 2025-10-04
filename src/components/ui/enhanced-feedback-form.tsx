import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { 
  Star, 
  Send, 
  X, 
  Calendar, 
  Clock, 
  User, 
  MessageCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addReview, Review } from "@/lib/skillService";
import { sendMessage } from "@/lib/messagingService";
import { format } from "date-fns";

interface EnhancedFeedbackFormProps {
  bookingId: string;
  skillId: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  skillTitle: string;
  reviewerId: string;
  reviewerName: string;
  sessionDate: Date;
  sessionTime: string;
  credits: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeedbackData {
  rating: number;
  comment: string;
  sessionQuality: 'excellent' | 'good' | 'average' | 'poor';
  wouldRecommend: boolean;
  highlights: string[];
  improvements: string[];
}

const sessionQualityOptions = [
  { value: 'excellent', label: 'Excellent', icon: Award, color: 'text-green-500' },
  { value: 'good', label: 'Good', icon: ThumbsUp, color: 'text-blue-500' },
  { value: 'average', label: 'Average', icon: CheckCircle, color: 'text-yellow-500' },
  { value: 'poor', label: 'Poor', icon: ThumbsDown, color: 'text-red-500' }
];

const highlightOptions = [
  'Clear explanations',
  'Patient and helpful',
  'Practical examples',
  'Good pace',
  'Interactive session',
  'Well prepared',
  'Answered all questions',
  'Professional approach'
];

const improvementOptions = [
  'More examples needed',
  'Slower pace',
  'Better preparation',
  'More interaction',
  'Clearer explanations',
  'Better time management',
  'More practical exercises',
  'Better follow-up'
];

export const EnhancedFeedbackForm = ({
  bookingId,
  skillId,
  providerId,
  providerName,
  providerAvatar,
  skillTitle,
  reviewerId,
  reviewerName,
  sessionDate,
  sessionTime,
  credits,
  onClose,
  onSuccess
}: EnhancedFeedbackFormProps) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    comment: '',
    sessionQuality: 'good',
    wouldRecommend: true,
    highlights: [],
    improvements: []
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const totalSteps = 4;

  const handleSubmit = async () => {
    if (feedback.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the review
      await addReview({
        bookingId,
        skillId,
        providerId,
        reviewerId,
        rating: feedback.rating,
        comment: feedback.comment.trim() || undefined,
      });

      // Send a thank you message to the provider
      try {
        await sendMessage(
          bookingId, // Using bookingId as conversationId for simplicity
          reviewerId,
          providerId,
          `Thank you for the great session! I rated it ${feedback.rating}/5 stars. ${feedback.comment ? `Here's my feedback: "${feedback.comment}"` : ''}`
        );
      } catch (messageError) {
        console.warn('Could not send thank you message:', messageError);
      }

      toast({
        title: "Feedback Submitted! 🎉",
        description: `Thank you for your detailed feedback on ${skillTitle}. Your feedback helps improve the community!`,
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

  const handleHighlightToggle = (highlight: string) => {
    setFeedback(prev => ({
      ...prev,
      highlights: prev.highlights.includes(highlight)
        ? prev.highlights.filter(h => h !== highlight)
        : [...prev.highlights, highlight]
    }));
  };

  const handleImprovementToggle = (improvement: string) => {
    setFeedback(prev => ({
      ...prev,
      improvements: prev.improvements.includes(improvement)
        ? prev.improvements.filter(i => i !== improvement)
        : [...prev.improvements, improvement]
    }));
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={providerAvatar} />
              <AvatarFallback>{providerName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Session Feedback</CardTitle>
              <CardDescription>
                Rate your session with {providerName}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Step {step} of {totalSteps}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(sessionDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{sessionTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{skillTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>{credits} credits</span>
              </div>
            </div>
          </div>

          {/* Step 1: Rating */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-medium mb-4 block">
                  How would you rate this session? *
                </Label>
                <div className="flex items-center gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-2"
                      onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoveredRating || feedback.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {feedback.rating > 0 && (
                  <p className="text-center text-lg font-medium mt-4">
                    {ratingLabels[feedback.rating - 1]}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={feedback.rating === 0}>
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Session Quality */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-medium mb-4 block">
                  How would you describe the overall session quality?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {sessionQualityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, sessionQuality: option.value as any }))}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          feedback.sessionQuality === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${option.color}`} />
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Previous
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Highlights and Improvements */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-medium mb-4 block">
                  What were the highlights of this session? (Select all that apply)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {highlightOptions.map((highlight) => (
                    <button
                      key={highlight}
                      type="button"
                      onClick={() => handleHighlightToggle(highlight)}
                      className={`p-3 text-sm border rounded-lg text-left transition-colors ${
                        feedback.highlights.includes(highlight)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {highlight}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-medium mb-4 block">
                  What could be improved? (Select all that apply)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {improvementOptions.map((improvement) => (
                    <button
                      key={improvement}
                      type="button"
                      onClick={() => handleImprovementToggle(improvement)}
                      className={`p-3 text-sm border rounded-lg text-left transition-colors ${
                        feedback.improvements.includes(improvement)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {improvement}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Previous
                </Button>
                <Button onClick={() => setStep(4)}>
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Comments and Recommendation */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-medium mb-4 block">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  placeholder="Share your detailed experience with this session..."
                  value={feedback.comment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  className="min-h-[120px]"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {feedback.comment.length}/1000 characters
                </p>
              </div>

              <div>
                <Label className="text-lg font-medium mb-4 block">
                  Would you recommend this provider to others?
                </Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: true }))}
                    className={`flex items-center gap-2 p-4 border rounded-lg transition-colors ${
                      feedback.wouldRecommend
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-border hover:border-green-500'
                    }`}
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span className="font-medium">Yes, I would recommend</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: false }))}
                    className={`flex items-center gap-2 p-4 border rounded-lg transition-colors ${
                      !feedback.wouldRecommend
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border hover:border-red-500'
                    }`}
                  >
                    <ThumbsDown className="h-5 w-5" />
                    <span className="font-medium">No, I would not recommend</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || feedback.rating === 0}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
