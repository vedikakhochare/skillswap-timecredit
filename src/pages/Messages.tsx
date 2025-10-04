import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { ConversationList } from "@/components/ui/conversation-list";
import { ChatWindow } from "@/components/ui/chat-window";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Message, 
  Conversation, 
  ConversationWithParticipants,
  getUserConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToUserConversations
} from "@/lib/messagingService";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getSkills } from "@/lib/skillService";
import { Skill } from "@/lib/skillService";
import { MessageCircle, Search, Users, Plus } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [searching, setSearching] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserConversations(user.uid, (conversations) => {
      setConversations(conversations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle URL parameters for opening specific conversations
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId || !user) return;

    const unsubscribe = subscribeToMessages(selectedConversationId, (messages) => {
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [selectedConversationId, user]);

  // Find selected conversation
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = conversations.find(
        conv => conv.conversation.id === selectedConversationId
      );
      setSelectedConversation(conversation?.conversation || null);
    } else {
      setSelectedConversation(null);
    }
  }, [selectedConversationId, conversations]);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || !selectedConversationId || !content.trim()) return;

    setSending(true);
    try {
      // Find the other participant
      const conversation = conversations.find(
        conv => conv.conversation.id === selectedConversationId
      );
      if (!conversation) return;

      const otherParticipant = conversation.participants.find(
        p => p.id !== user.uid
      );
      if (!otherParticipant) return;

      await sendMessage(
        selectedConversationId,
        user.uid,
        otherParticipant.id,
        content
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  }, [user, selectedConversationId, conversations]);

  const handleMarkAsRead = useCallback(async () => {
    if (!user || !selectedConversationId) return;

    try {
      await markMessagesAsRead(selectedConversationId, user.uid);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user, selectedConversationId]);

  const handleStartNewChat = useCallback(() => {
    setNewChatOpen(true);
  }, []);

  const handleSearchSkills = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const skills = await getSkills(20);
      const filtered = skills.filter(skill => 
        skill.title.toLowerCase().includes(query.toLowerCase()) ||
        skill.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching skills:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleStartConversation = useCallback(async (skill: Skill) => {
    if (!user) return;

    try {
      const conversationId = await getOrCreateConversation(
        user.uid,
        skill.providerId,
        { skillId: skill.id }
      );
      
      setSelectedConversationId(conversationId);
      setNewChatOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onStartNewChat={handleStartNewChat}
            loading={loading}
          />
          
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUserId={user?.uid || ""}
            onSendMessage={handleSendMessage}
            onBack={() => setSelectedConversationId(null)}
            onMarkAsRead={handleMarkAsRead}
            sending={sending}
          />
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex-1">
          {selectedConversationId ? (
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user?.uid || ""}
              onSendMessage={handleSendMessage}
              onBack={() => setSelectedConversationId(null)}
              onMarkAsRead={handleMarkAsRead}
              sending={sending}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onStartNewChat={handleStartNewChat}
              loading={loading}
            />
          )}
        </div>
      </main>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Search Skills</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search for skills to start a conversation..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearchSkills(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleStartConversation(skill)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={skill.providerAvatar} />
                      <AvatarFallback>
                        {skill.providerName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{skill.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {skill.creditsPerHour} credits/hr
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        by {skill.providerName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {skill.description}
                      </p>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No skills found</p>
                <p className="text-sm">Try searching with different keywords</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
