# In-App Messaging System

## Overview
The in-app messaging system allows users to communicate directly with each other for skill exchanges, session coordination, and general communication.

## Features Implemented

### Core Messaging
- **Real-time messaging** - Messages update in real-time using Firebase listeners
- **Conversation management** - Create and manage conversations between users
- **Message types** - Support for text and system messages
- **Read receipts** - Track message read status
- **Unread notifications** - Show unread message counts in header

### User Interface
- **Chat interface** - Modern chat UI with message bubbles
- **Conversation list** - Browse and search conversations
- **Mobile responsive** - Works on desktop and mobile devices
- **Message input** - Auto-resizing text input with emoji support

### Integration Features
- **Skill-based messaging** - Start conversations from skill detail pages
- **Booking integration** - Message users from dashboard bookings
- **URL parameters** - Direct links to specific conversations
- **Navigation integration** - Messages accessible from header navigation

## Technical Implementation

### Data Models
```typescript
interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id?: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  skillId?: string;
  bookingId?: string;
}
```

### Firebase Collections
- `conversations` - Stores conversation metadata
- `messages` - Stores individual messages
- Real-time listeners for live updates

### Key Components
- `MessageBubble` - Individual message display
- `ChatInput` - Message input with auto-resize
- `ConversationList` - List of user conversations
- `ChatWindow` - Main chat interface
- `MessageNotification` - Unread count indicator

### Service Functions
- `createConversation()` - Create new conversations
- `getOrCreateConversation()` - Get existing or create new
- `sendMessage()` - Send messages with real-time updates
- `getMessages()` - Retrieve conversation messages
- `markMessagesAsRead()` - Update read status
- `subscribeToMessages()` - Real-time message listener
- `subscribeToUserConversations()` - Real-time conversation listener

## Usage

### Starting a Conversation
1. From skill detail page - Click "Message Provider" button
2. From dashboard - Click "Message" button on booking cards
3. From messages page - Use "New Chat" to search and start conversations

### Navigation
- Access via header "Messages" link (with unread count badge)
- Direct links: `/messages?conversation={conversationId}`
- Mobile-friendly responsive design

### Real-time Features
- Messages appear instantly without page refresh
- Unread counts update automatically
- Conversation list updates in real-time
- Read receipts update when messages are viewed

## Future Enhancements
- File and image sharing
- Message reactions and emoji
- Message search functionality
- Group conversations
- Message encryption
- Push notifications
- Message history pagination
- Typing indicators
- Message editing and deletion
