import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, TrendingUp, TrendingDown, Plus, Calendar, Star, MessageSquare, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getUserSkills, getUserBookings, getProviderBookings, updateBookingStatus, completeSessionWithCredits, addReview, Skill, Booking } from "@/lib/skillService";
import { getEnhancedUserTransactions, getTransactionSummary, subscribeToUserTransactions, Transaction } from "@/lib/transactionService";
import { getUserProfile } from "@/lib/userService";
import { getOrCreateSimpleConversation } from "@/lib/simpleMessagingService";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackForm } from "@/components/ui/feedback-form";
import { EnhancedFeedbackForm } from "@/components/ui/enhanced-feedback-form";
import { AISkillDashboard } from "@/components/ui/ai-skill-dashboard";
// import { CalendarIntegration } from "@/components/ui/calendar-integration";

const Dashboard = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionSummary, setTransactionSummary] = useState({
    totalEarned: 0,
    totalSpent: 0,
    netCredits: 0,
    transactionCount: 0
  });
  const [incomingRequests, setIncomingRequests] = useState<Booking[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMeetingUrl, setConfirmMeetingUrl] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [enhancedFeedbackOpen, setEnhancedFeedbackOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const generateJitsiUrl = (bookingId: string) => {
    const room = `TimeShare-${bookingId}`;
    return `https://meet.jit.si/${room}`;
  };

  const handleMessageUser = async (booking: Booking) => {
    if (!user) return;

    try {
      const otherUserId = booking.requesterId === user.uid ? booking.providerId : booking.requesterId;
      
      // Get user profiles for both participants
      const [currentUserProfile, otherUserProfile] = await Promise.all([
        getUserProfile(user.uid),
        getUserProfile(otherUserId)
      ]);

      const conversationId = await getOrCreateSimpleConversation(user.uid, otherUserId, {
        bookingId: booking.id,
        skillId: booking.skillId,
        skillTitle: booking.skillTitle,
        participantNames: {
          [user.uid]: currentUserProfile?.displayName || currentUserProfile?.email || 'You',
          [otherUserId]: otherUserProfile?.displayName || otherUserProfile?.email || 'User'
        },
        participantAvatars: {
          [user.uid]: currentUserProfile?.photoURL || '',
          [otherUserId]: otherUserProfile?.photoURL || ''
        }
      });
      
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [skills, bookings, enhancedTransactions, summary, providerBookings] = await Promise.all([
        getUserSkills(user.uid),
        getUserBookings(user.uid),
        getEnhancedUserTransactions(user.uid),
        getTransactionSummary(user.uid),
        getProviderBookings(user.uid)
      ]);

      setMySkills(skills);
      // Combine user bookings and provider bookings for upcoming sessions
      const allUpcomingSessions = [
        ...bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'pending'),
        ...providerBookings.filter(booking => booking.status === 'confirmed')
      ];
      setUpcomingSessions(allUpcomingSessions);
      setIncomingRequests(providerBookings.filter(b => b.status === 'pending'));
      setTransactions(enhancedTransactions);
      setTransactionSummary(summary);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Real-time transaction updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserTransactions(user.uid, (transactions) => {
      setTransactions(transactions);
    });

    return () => unsubscribe();
  }, [user]);

  const userCredits = userProfile?.credits || 0;
  const creditsEarned = transactionSummary.totalEarned;
  const creditsSpent = transactionSummary.totalSpent;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">Manage your skills and track your credits</p>
          </div>
          <Link to="/post-skill">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Post a Skill
            </Button>
          </Link>
        </div>

        {/* Credit Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <CreditBadge amount={userCredits} variant="large" />
                <Clock className="h-8 w-8 text-credit" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Credits Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">{creditsEarned}</span>
                <span className="text-muted-foreground text-sm">total earned</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Transactions</span>
                  <span className="font-medium">{transactionSummary.transactionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Credits</span>
                  <span className={`font-medium ${transactionSummary.netCredits >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transactionSummary.netCredits >= 0 ? '+' : ''}{transactionSummary.netCredits}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Credits Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                <span className="text-3xl font-bold">{creditsSpent}</span>
                <span className="text-muted-foreground text-sm">total spent</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="ai-learning">AI Learning</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="myskills">My Skills</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading sessions...</p>
              </div>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => {
                const isProvider = session.providerId === user?.uid;
                const isRequester = session.requesterId === user?.uid;

                return (
                  <Card key={session.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-10 w-10 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">
                            {session.skillTitle || 'Session'} #{session.id}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Scheduled for {session.date.toLocaleDateString()}
                          </p>
                          {isProvider && (
                            <p className="text-xs text-blue-500">You're the provider</p>
                          )}
                          {isRequester && (
                            <p className="text-xs text-green-500">You're the requester</p>
                          )}
                          {session.status === 'pending' && (
                            <p className="text-xs text-orange-500">Pending confirmation</p>
                          )}
                          {session.status === 'confirmed' && !session.meetingUrl && (
                            <p className="text-xs text-muted-foreground">Meeting link will appear here once confirmed</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-medium">{session.time}</p>
                        <CreditBadge amount={session.credits} variant="small" className="mt-2" />
                        {session.meetingUrl && (
                          <Button asChild size="sm">
                            <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                              Join Session
                            </a>
                          </Button>
                        )}
                        {session.status === 'confirmed' && isProvider && (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!session.id) return;
                                try {
                                  const result = await completeSessionWithCredits(session.id);
                                  if (result.success) {
                                    setUpcomingSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: 'completed' } : s));
                                    // Show success message
                                    console.log('Session completed:', result.message);
                                  } else {
                                    console.error('Session completion failed:', result.message);
                                    // You could show an error toast here
                                  }
                                } catch (e) {
                                  console.error('Complete session failed', e);
                                }
                              }}
                              className="w-full"
                            >
                              Mark Completed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Calendar integration temporarily disabled
                                console.log('Calendar integration coming soon');
                              }}
                              className="w-full"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Add to Calendar (Soon)
                            </Button>
                          </div>
                        )}
                        {session.status === 'completed' && isRequester && !session.reviewed && (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(session);
                                setEnhancedFeedbackOpen(true);
                              }}
                              className="w-full"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Leave Detailed Feedback
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(session);
                                setFeedbackOpen(true);
                              }}
                              className="w-full"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Quick Feedback
                            </Button>
                          </div>
                        )}
                        {session.status === 'completed' && isRequester && session.reviewed && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessageUser(session)}
                          className="mt-2"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground">Book a skill to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-learning" className="space-y-6">
            <AISkillDashboard />
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading requests...</p>
              </div>
            ) : incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-6 gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{request.skillTitle || 'Session Request'}</h3>
                      <p className="text-muted-foreground text-sm">
                        Requested for {request.date.toLocaleDateString()} at {request.time}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cost: {request.credits} credits
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await updateBookingStatus(request.id!, 'declined');
                          setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveRequestId(request.id!);
                          setConfirmMeetingUrl("");
                          setConfirmOpen(true);
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">You'll see new session requests here.</p>
              </div>
            )}
          </TabsContent>

          {/* Confirm Modal */}
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Meeting URL</label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={confirmMeetingUrl}
                  onChange={(e) => setConfirmMeetingUrl(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!activeRequestId) return;
                    try {
                      const url = (confirmMeetingUrl && confirmMeetingUrl.trim().length > 0)
                        ? confirmMeetingUrl
                        : generateJitsiUrl(activeRequestId);

                      // Update booking status to confirmed - this will trigger the Firebase function
                      // to handle credit transfer and slot decrementing
                      await updateBookingStatus(activeRequestId, 'confirmed', {
                        meetingUrl: url,
                        confirmedAt: new Date(),
                      });

                      setIncomingRequests(prev => prev.filter(r => r.id !== activeRequestId));
                      const confirmed = incomingRequests.find(r => r.id === activeRequestId);
                      if (confirmed) {
                        setUpcomingSessions(prev => [{ ...confirmed, status: 'confirmed', meetingUrl: url }, ...prev]);
                      }

                      // Refresh dashboard data to show updated credits and slots
                      fetchDashboardData();
                    } catch (e) {
                      console.error('Confirm booking failed', e);
                    } finally {
                      setConfirmOpen(false);
                      setActiveRequestId(null);
                      setConfirmMeetingUrl("");
                    }
                  }}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <TabsContent value="myskills" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading skills...</p>
              </div>
            ) : mySkills.length > 0 ? (
              mySkills.map((skill) => (
                <Card key={skill.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{skill.title}</h3>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{skill.category}</Badge>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-credit text-credit" />
                          <span>{skill.rating || 0}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{skill.totalSessions || 0} sessions</span>
                      </div>
                    </div>
                    <CreditBadge amount={skill.creditsPerHour} />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No skills posted yet</h3>
                <p className="text-muted-foreground mb-4">Share your expertise and start earning credits!</p>
                <Link to="/post-skill">
                  <Button>Post Your First Skill</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      {transaction.type === "earned" ? (
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-orange-500" />
                      )}
                      <div>
                        <h3 className="font-semibold">{transaction.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {transaction.skillTitle && `Skill: ${transaction.skillTitle}`}
                          {transaction.skillTitle && transaction.type === 'earned' && ` • From: ${transaction.fromUserName}`}
                          {transaction.skillTitle && transaction.type === 'spent' && ` • To: ${transaction.toUserName}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === "earned" ? "text-green-500" : "text-orange-500"}`}>
                        {transaction.type === "earned" ? "+" : "-"}{transaction.credits} credits
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.createdAt.toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">Start booking skills to see your transaction history!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Feedback Form Modal */}
      {feedbackOpen && selectedBooking && (
        <FeedbackForm
          bookingId={selectedBooking.id!}
          skillId={selectedBooking.skillId}
          providerId={selectedBooking.providerId}
          providerName={selectedBooking.providerName || "Provider"}
          skillTitle={selectedBooking.skillTitle || "Skill"}
          reviewerId={user?.uid || ""}
          onClose={() => {
            setFeedbackOpen(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            // Refresh the dashboard data to show updated review status
            fetchDashboardData();
          }}
        />
      )}

      {/* Enhanced Feedback Form Modal */}
      {enhancedFeedbackOpen && selectedBooking && (
        <EnhancedFeedbackForm
          bookingId={selectedBooking.id!}
          skillId={selectedBooking.skillId}
          providerId={selectedBooking.providerId}
          providerName={selectedBooking.providerName || "Provider"}
          providerAvatar={undefined} // You might want to get this from user profile
          skillTitle={selectedBooking.skillTitle || "Skill"}
          reviewerId={user?.uid || ""}
          reviewerName={userProfile?.displayName || "User"}
          sessionDate={selectedBooking.date}
          sessionTime={selectedBooking.time}
          credits={selectedBooking.credits}
          onClose={() => {
            setEnhancedFeedbackOpen(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            // Refresh the dashboard data to show updated review status
            fetchDashboardData();
          }}
        />
      )}

      {/* Calendar Integration Modal - Temporarily Disabled */}
      {/* {calendarOpen && selectedBooking && (
        <CalendarIntegration
          booking={{
            id: selectedBooking.id!,
            skillTitle: selectedBooking.skillTitle || "Skill",
            providerName: selectedBooking.providerName || "Provider",
            providerEmail: undefined, // You might want to get this from user profile
            requesterName: userProfile?.displayName || "User",
            requesterEmail: user?.email || undefined,
            date: selectedBooking.date,
            time: selectedBooking.time,
            credits: selectedBooking.credits,
            status: selectedBooking.status
          }}
          onClose={() => {
            setCalendarOpen(false);
            setSelectedBooking(null);
          }}
          onEventCreated={(eventId) => {
            console.log('Calendar event created:', eventId);
            // You might want to store the event ID in the booking
          }}
        />
      )} */}
    </div>
  );
};

export default Dashboard;
