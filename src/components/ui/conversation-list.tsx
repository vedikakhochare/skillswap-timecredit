import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Users } from "lucide-react";
import { ConversationWithParticipants } from "@/lib/messagingService";
import { format } from "date-fns";

interface ConversationListProps {
  conversations: ConversationWithParticipants[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onStartNewChat: () => void;
  loading?: boolean;
}

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onStartNewChat,
  loading = false
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    return conv.participants.some(participant => 
      participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="w-80 border-r bg-background">
        <div className="p-4 border-b">
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="sm" onClick={onStartNewChat}>
            <MessageCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to begin messaging</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.conversation.id;
              const lastMessage = conversation.conversation.lastMessage;
              const participant = conversation.participants[0]; // Get the other participant
              
              return (
                <Card
                  key={conversation.conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isSelected ? "bg-muted" : ""
                  }`}
                  onClick={() => onSelectConversation(conversation.conversation.id!)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant?.avatar} />
                          <AvatarFallback>
                            {participant?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                            variant="destructive"
                          >
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {participant?.name || "Unknown User"}
                          </h3>
                          {conversation.conversation.lastMessageAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(conversation.conversation.lastMessageAt, "HH:mm")}
                            </span>
                          )}
                        </div>
                        
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {lastMessage.type === 'system' ? (
                              <span className="italic">{lastMessage.content}</span>
                            ) : (
                              lastMessage.content
                            )}
                          </p>
                        )}
                        
                        {conversation.conversation.skillId && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Skill Exchange
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
