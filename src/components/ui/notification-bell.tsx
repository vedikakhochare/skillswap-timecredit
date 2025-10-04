import { useState, useEffect } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { ScrollArea } from "./scroll-area";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  MessageCircle, 
  Calendar, 
  Star, 
  CreditCard,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  Notification 
} from "@/lib/notificationService";
import { format } from "date-fns";

interface NotificationBellProps {
  className?: string;
}

const notificationIcons = {
  feedback_reminder: Star,
  session_reminder: Calendar,
  session_confirmed: Calendar,
  session_completed: Star,
  new_message: MessageCircle,
  credit_earned: CreditCard
};

const notificationColors = {
  feedback_reminder: "text-yellow-500",
  session_reminder: "text-blue-500",
  session_confirmed: "text-green-500",
  session_completed: "text-green-500",
  new_message: "text-purple-500",
  credit_earned: "text-green-500"
};

export const NotificationBell = ({ className }: NotificationBellProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const [notificationsData, unreadCountData] = await Promise.all([
          getUserNotifications(user.uid, 20),
          getUnreadNotificationCount(user.uid)
        ]);
        setNotifications(notificationsData);
        setUnreadCount(unreadCountData);
      } catch (error) {
        console.error('Error loading notifications:', error);
        // Set empty state on error to prevent crashes
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id!);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate to the action URL if provided
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl;
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${className}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            variant="destructive"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-80 z-50 max-h-96">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllRead}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type];
                      const colorClass = notificationColors[notification.type];
                      
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                            !notification.isRead ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${
                              !notification.isRead ? 'bg-blue-100' : ''
                            }`}>
                              <Icon className={`h-4 w-4 ${colorClass}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-sm font-medium ${
                                  !notification.isRead ? 'font-semibold' : ''
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(notification.createdAt, 'MMM dd, HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
