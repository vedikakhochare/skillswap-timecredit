import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  CheckCircle,
  ExternalLink,
  Copy,
  Share2,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  GoogleCalendarService, 
  createCalendarEventFromBooking,
  generateMeetingUrl,
  generateJitsiUrl,
  CalendarEvent,
  defaultGoogleCalendarConfig
} from "@/lib/calendarService";
import { format, addDays } from "date-fns";

interface CalendarIntegrationProps {
  booking: {
    id: string;
    skillTitle: string;
    providerName: string;
    providerEmail?: string;
    requesterName: string;
    requesterEmail?: string;
    date: Date;
    time: string;
    credits: number;
    status: string;
  };
  onClose: () => void;
  onEventCreated?: (eventId: string) => void;
}

export const CalendarIntegration = ({
  booking,
  onClose,
  onEventCreated
}: CalendarIntegrationProps) => {
  const [calendarService] = useState(() => new GoogleCalendarService(defaultGoogleCalendarConfig));
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = useState<string>("");
  const [calendarUrl, setCalendarUrl] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    initializeCalendar();
    generateMeetingLinks();
  }, []);

  const initializeCalendar = async () => {
    try {
      const initialized = await calendarService.initialize();
      if (initialized) {
        const signedIn = await calendarService.isSignedIn();
        setIsSignedIn(signedIn);
      }
    } catch (error) {
      console.error('Calendar initialization failed:', error);
    }
  };

  const generateMeetingLinks = () => {
    const googleMeetUrl = generateMeetingUrl(booking.id, booking.providerName);
    const jitsiUrl = generateJitsiUrl(booking.id);
    setMeetingUrl(googleMeetUrl);
    
    // Generate calendar URL for adding to calendar
    const startTime = new Date(booking.date);
    const [time, period] = booking.time.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    startTime.setHours(hour24, parseInt(minutes), 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`TimeShare Session: ${booking.skillTitle}`)}&dates=${format(startTime, 'yyyyMMddTHHmmss')}/${format(endTime, 'yyyyMMddTHHmmss')}&details=${encodeURIComponent(`Skill exchange session with ${booking.providerName}`)}&location=${encodeURIComponent(googleMeetUrl)}`;
    setCalendarUrl(calendarUrl);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const success = await calendarService.signIn();
      if (success) {
        setIsSignedIn(true);
        toast({
          title: "Connected to Google Calendar",
          description: "You can now create calendar events for your sessions.",
        });
      } else {
        toast({
          title: "Sign-in Failed",
          description: "Could not connect to Google Calendar. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      toast({
        title: "Sign-in Failed",
        description: "Could not connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!isSignedIn) {
      await handleGoogleSignIn();
      return;
    }

    setIsLoading(true);
    try {
      const calendarEvent = createCalendarEventFromBooking(
        booking,
        booking.skillTitle,
        booking.providerName,
        booking.requesterName
      );

      const eventId = await calendarService.createEvent(calendarEvent);
      
      if (eventId) {
        setEventCreated(true);
        setEventId(eventId);
        onEventCreated?.(eventId);
        toast({
          title: "Event Created! 🎉",
          description: "Your session has been added to your Google Calendar.",
        });
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      console.error('Event creation failed:', error);
      toast({
        title: "Event Creation Failed",
        description: "Could not create calendar event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMeetingUrl = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      toast({
        title: "Meeting URL Copied",
        description: "The meeting link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Could not copy meeting URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenCalendar = () => {
    window.open(calendarUrl, '_blank');
  };

  const handleShareEvent = async () => {
    const shareData = {
      title: `TimeShare Session: ${booking.skillTitle}`,
      text: `Join me for a skill exchange session with ${booking.providerName}`,
      url: meetingUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copying URL
      await handleCopyMeetingUrl();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Add this session to your calendar and get meeting links
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{booking.providerName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{booking.skillTitle}</h3>
                <p className="text-muted-foreground">with {booking.providerName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(booking.date, 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {booking.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    Online Session
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                {booking.credits} credits
              </Badge>
            </div>
          </div>

          {/* Meeting Links */}
          <div className="space-y-4">
            <h4 className="font-medium">Meeting Options</h4>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Video className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google Meet</p>
                    <p className="text-sm text-muted-foreground">Recommended for best experience</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyMeetingUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" asChild>
                    <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Video className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Jitsi Meet</p>
                    <p className="text-sm text-muted-foreground">Alternative video conferencing</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(generateJitsiUrl(booking.id));
                    toast({ title: "Jitsi URL Copied", description: "The Jitsi meeting link has been copied." });
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" asChild>
                    <a href={generateJitsiUrl(booking.id)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="space-y-4">
            <h4 className="font-medium">Calendar Integration</h4>
            
            {!isSignedIn ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Connect Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      Add this session to your calendar with automatic reminders
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Connect Google Calendar
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {!eventCreated ? (
                  <Button 
                    onClick={handleCreateEvent}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Event...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Add to Google Calendar
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Event Created Successfully!</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your session has been added to your Google Calendar with reminders.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleOpenCalendar} className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Calendar
                  </Button>
                  <Button variant="outline" onClick={handleShareEvent} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              </div>
            )}

            {/* Alternative: Manual Calendar Add */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Manual Calendar Add</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You can also add this event manually to any calendar app:
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenCalendar}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar (Manual)
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {eventCreated && (
              <Button onClick={handleShareEvent} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
