import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToUserConversations, ConversationWithParticipants } from "@/lib/messagingService";

export const MessageNotification = () => {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserConversations(user.uid, (conversations: ConversationWithParticipants[]) => {
      try {
        const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
        setTotalUnread(unreadCount);
      } catch (error) {
        console.error('Error processing conversations:', error);
        setTotalUnread(0);
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from conversations:', error);
      }
    };
  }, [user]);

  if (!user || totalUnread === 0) return null;

  return (
    <div className="relative">
      <MessageCircle className="h-5 w-5" />
      <Badge 
        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        variant="destructive"
      >
        {totalUnread > 9 ? "9+" : totalUnread}
      </Badge>
    </div>
  );
};
