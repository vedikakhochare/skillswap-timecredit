import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { Message, Conversation } from "@/lib/messagingService";
import { ArrowLeft, Phone, Video, MoreVertical, User } from "lucide-react";
import { format } from "date-fns";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onMarkAsRead: () => void;
  loading?: boolean;
  sending?: boolean;
}

export const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  onMarkAsRead,
  loading = false,
  sending = false
}: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [participantName, setParticipantName] = useState("Unknown User");
  const [participantAvatar, setParticipantAvatar] = useState<string | undefined>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (conversation) {
      onMarkAsRead();
    }
  }, [conversation, onMarkAsRead]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Select a conversation</h3>
            <p className="text-muted-foreground">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="h-16 bg-muted animate-pulse" />
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-16 bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <CardHeader className="border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={participantAvatar} />
              <AvatarFallback>
                {participantName[0] || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className="text-lg">{participantName}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Online
                </Badge>
                {conversation.skillId && (
                  <Badge variant="outline" className="text-xs">
                    Skill Exchange
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </CardHeader>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                senderName={isOwn ? undefined : participantName}
                senderAvatar={isOwn ? undefined : participantAvatar}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={sending}
        placeholder="Type a message..."
      />
    </div>
  );
};
