import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Clock, Calendar as CalendarIcon, CheckCircle2, MessageCircle } from "lucide-react";
import { getSkillById, createBooking, createTransaction, Skill } from "@/lib/skillService";
import { updateUserCredits, getUserProfile } from "@/lib/userService";
import { getOrCreateSimpleConversation } from "@/lib/simpleMessagingService";
// import { CalendarIntegration } from "@/components/ui/calendar-integration";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ReviewDisplay } from "@/components/ui/review-display";

const SkillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchSkill = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const skillData = await getSkillById(id);
        setSkill(skillData);
      } catch (error) {
        console.error('Error fetching skill:', error);
        toast({
          title: "Error Loading Skill",
          description: "Could not load skill details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [id, toast]);

  const availableTimes = ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM", "6:00 PM"];

  const handleMessageProvider = async () => {
    if (!user || !skill) return;

    try {
      // Get user profiles for both participants
      const [currentUserProfile, providerProfile] = await Promise.all([
        getUserProfile(user.uid),
        getUserProfile(skill.providerId)
      ]);

      const conversationId = await getOrCreateSimpleConversation(user.uid, skill.providerId, {
        skillId: skill.id,
        skillTitle: skill.title,
        participantNames: {
          [user.uid]: currentUserProfile?.displayName || currentUserProfile?.email || 'You',
          [skill.providerId]: providerProfile?.displayName || providerProfile?.email || skill.providerName || 'Provider'
        },
        participantAvatars: {
          [user.uid]: currentUserProfile?.photoURL || '',
          [skill.providerId]: providerProfile?.photoURL || skill.providerAvatar || ''
        }
      });
      
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Could not start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBooking = async () => {
    console.log('Booking attempt started:', {
      user: user?.uid,
      userProfile: userProfile,
      skill: skill?.id,
      selectedDate,
      selectedTime
    });

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a session.",
        variant: "destructive",
      });
      return;
    }

    if (!skill) {
      toast({
        title: "Skill Not Found",
        description: "This skill is no longer available.",
        variant: "destructive",
      });
      return;
    }

    // Prevent users from booking their own sessions
    if (user.uid === skill.providerId) {
      toast({
        title: "Cannot Book Own Session",
        description: "You cannot book a session for your own skill offering.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    if (userProfile && userProfile.credits < skill.creditsPerHour) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${skill.creditsPerHour} credits to book this session. You have ${userProfile.credits} credits.`,
        variant: "destructive",
      });
      return;
    }

    if (skill.availableSlots <= 0) {
      toast({
        title: "No Slots Available",
        description: "This skill has no available slots at the moment.",
        variant: "destructive",
      });
      return;
    }

    console.log('All validations passed, starting booking...');
    setBookingLoading(true);

    try {
      // Create the booking request (pending) - credits will be transferred on confirmation
      await createBooking({
        skillId: skill.id!,
        requesterId: user.uid,
        providerId: skill.providerId,
        date: selectedDate,
        time: selectedTime,
        status: 'pending', // Create as pending so provider can see and confirm
        credits: skill.creditsPerHour
      });

      toast({
        title: "Booking Request Sent! 🎉",
        description: `Your session request with ${skill.providerName} has been sent for ${selectedDate.toLocaleDateString()} at ${selectedTime}. You'll be notified when confirmed.`,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error('Error creating booking:', error);

      let errorMessage = "There was an error creating your booking. Please try again.";

      if (error.message) {
        if (error.message.includes('Insufficient credits')) {
          errorMessage = "You don't have enough credits for this session.";
        } else if (error.message.includes('No available slots')) {
          errorMessage = "No slots are available for this session.";
        } else if (error.message.includes('User or skill not found')) {
          errorMessage = "Session or user information not found. Please refresh and try again.";
        } else {
          errorMessage = `Booking failed: ${error.message}`;
        }
      }

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading skill details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Skill Not Found</h1>
            <p className="text-muted-foreground mb-4">This skill is no longer available.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="secondary">{skill.category}</Badge>
                  <CreditBadge amount={skill.creditsPerHour} />
                </div>
                <h1 className="text-3xl font-bold mb-4">{skill.title}</h1>
                <p className="text-muted-foreground leading-relaxed">{skill.description}</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold mb-4">What You'll Get</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(skill.highlights || []).map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
            </Card>

            {/* Provider Info */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold mb-4">About the Provider</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={skill.providerAvatar} />
                    <AvatarFallback className="text-lg">{skill.providerName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{skill.providerName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-credit text-credit" />
                        <span>{skill.rating || 0} ({skill.reviewCount || 0} reviews)</span>
                      </div>
                      <span>•</span>
                      <span>{skill.totalSessions || 0} sessions</span>
                    </div>
                    <p className="text-muted-foreground mb-2">{skill.bio}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Responds in {skill.responseTime}</span>
                    </div>
                    
                    {user && user.uid !== skill.providerId && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleMessageProvider}
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message Provider
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Reviews Section */}
            <Card>
              <ReviewDisplay skillId={skill.id!} />
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <h2 className="text-xl font-semibold mb-4">Book a Session</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Select Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">1 hour</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost</span>
                    <CreditBadge amount={skill.creditsPerHour} variant="small" />
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Available slots</span>
                    <span className="font-medium">{skill.availableSlots} left</span>
                  </div>
                  {userProfile && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Your credits</span>
                      <span className="font-medium">{userProfile.credits}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleBooking}
                    className="w-full"
                    size="lg"
                    disabled={bookingLoading || !user || (user && user.uid === skill.providerId) || skill.availableSlots <= 0}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {bookingLoading ? "Creating Booking..." :
                      (user && user.uid === skill.providerId) ? "Your Own Session" :
                        skill.availableSlots <= 0 ? "No Slots Available" :
                          "Request Booking"}
                  </Button>
                  
                  {user && user.uid !== skill.providerId && skill.availableSlots > 0 && selectedDate && selectedTime && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Calendar integration temporarily disabled
                        console.log('Calendar preview coming soon');
                      }}
                      className="w-full"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Preview Calendar Event (Soon)
                    </Button>
                  )}
                </div>

                {user && user.uid === skill.providerId && (
                  <p className="text-xs text-center text-muted-foreground">
                    You cannot book your own session
                  </p>
                )}

                {skill.availableSlots <= 0 && user && user.uid !== skill.providerId && (
                  <p className="text-xs text-center text-muted-foreground">
                    No slots available at the moment
                  </p>
                )}

                {user && user.uid !== skill.providerId && skill.availableSlots > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Credits will be transferred when your request is confirmed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Calendar Integration Modal - Temporarily Disabled */}
      {/* {calendarOpen && skill && selectedDate && selectedTime && (
        <CalendarIntegration
          booking={{
            id: `preview-${Date.now()}`,
            skillTitle: skill.title,
            providerName: skill.providerName,
            providerEmail: undefined,
            requesterName: userProfile?.displayName || "User",
            requesterEmail: user?.email || undefined,
            date: selectedDate,
            time: selectedTime,
            credits: skill.creditsPerHour,
            status: 'preview'
          }}
          onClose={() => setCalendarOpen(false)}
          onEventCreated={(eventId) => {
            console.log('Preview calendar event created:', eventId);
            setCalendarOpen(false);
          }}
        />
      )} */}
    </div>
  );
};

// Label component for consistency
const Label = ({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) => (
  <label className={className} {...props} />
);

export default SkillDetail;
