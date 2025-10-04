import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Search,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  SimpleMessage, 
  SimpleConversation,
  getUserSimpleConversations,
  getOrCreateSimpleConversation,
  getSimpleMessages,
  sendSimpleMessage,
  subscribeToSimpleMessages,
  subscribeToUserSimpleConversations
} from "@/lib/simpleMessagingService";
import { SimpleChatWindow } from "@/components/ui/simple-chat-window";
import { format } from "date-fns";

const WorkingMessages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Handle URL parameters for opening specific conversations
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [searchParams]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserSimpleConversations(user.uid, (conversations) => {
      setConversations(conversations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId || !user) return;

    const unsubscribe = subscribeToSimpleMessages(selectedConversationId, (messages) => {
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [selectedConversationId, user]);

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedConversationId || !content.trim()) return;

    setSending(true);
    try {
      // Find the other participant
      const conversation = conversations.find(conv => conv.id === selectedConversationId);
      if (!conversation) return;

      const otherParticipant = conversation.participants.find(p => p !== user.uid);
      if (!otherParticipant) return;

      await sendSimpleMessage(
        selectedConversationId,
        user.uid,
        otherParticipant,
        content.trim()
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!user) return;

    // For demo purposes, create a conversation with a dummy user
    // In a real app, you'd have a user selection interface
    const dummyUserId = "demo-user-123";
    
    try {
      const conversationId = await getOrCreateSimpleConversation(user.uid, dummyUserId);
      setSelectedConversationId(conversationId);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-muted-foreground">You need to be signed in to access messages.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading messages...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1">
          {/* Conversation List */}
          <div className="w-80 border-r bg-background flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Messages</h2>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a new chat to begin messaging</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => {
                    const isSelected = selectedConversationId === conversation.id;
                    const otherParticipant = conversation.participants.find(p => p !== user.uid);
                    const otherParticipantName = otherParticipant ? 
                      (conversation.participantNames?.[otherParticipant] || "Unknown User") : 
                      "Unknown User";
                    const otherParticipantAvatar = otherParticipant ? 
                      (conversation.participantAvatars?.[otherParticipant] || "") : 
                      "";
                    
                    return (
                      <Card
                        key={conversation.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          isSelected ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedConversationId(conversation.id!)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              {otherParticipantAvatar ? (
                                <AvatarImage src={otherParticipantAvatar} alt={otherParticipantName} />
                              ) : null}
                              <AvatarFallback>
                                {otherParticipantName[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium truncate">
                                  {otherParticipantName}
                                </h3>
                                {conversation.lastMessageAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(conversation.lastMessageAt, "HH:mm")}
                                  </span>
                                )}
                              </div>
                              
                              {conversation.skillTitle && (
                                <p className="text-xs text-blue-600 truncate">
                                  About: {conversation.skillTitle}
                                </p>
                              )}
                              
                              {conversation.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {conversation.lastMessage}
                                </p>
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

          {/* Chat Window */}
          <SimpleChatWindow
            conversation={selectedConversationId ? conversations.find(conv => conv.id === selectedConversationId) || null : null}
            messages={messages}
            currentUserId={user?.uid || ""}
            onSendMessage={handleSendMessage}
            onBack={() => setSelectedConversationId(null)}
            loading={loading}
            sending={sending}
          />
        </div>

      </main>
    </div>
  );
};

export default WorkingMessages;
