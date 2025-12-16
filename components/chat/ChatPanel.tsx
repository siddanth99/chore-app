'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Paperclip, Image, MapPin, Mic, Smile, AlertCircle,
  CheckCheck, Check, X, MessageCircle, Sparkles, Clock
} from 'lucide-react';
import Button from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

// ============================================
// Types
// ============================================
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  createdAt?: string; // ISO date string from API
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
}

interface ApiMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface ChatPanelProps {
  mode: 'pre-assignment' | 'post-assignment';
  choreId: string;
  currentUserId: string;
  choreTitle?: string;
  otherPartyName?: string;
  otherPartyAvatar?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// ============================================
// Mock Messages
// ============================================
const mockPreAssignmentMessages: Message[] = [
  {
    id: '1',
    senderId: 'worker',
    senderName: 'Rajesh Kumar',
    content: 'Hi! I saw your chore posting. Could you tell me more about the cleaning supplies available?',
    timestamp: '10:30 AM',
    isOwn: false,
    status: 'seen',
  },
  {
    id: '2',
    senderId: 'customer',
    senderName: 'You',
    content: 'Hello Rajesh! Yes, I have all basic cleaning supplies - mop, broom, floor cleaner, and bathroom cleaner. Would you need anything specific?',
    timestamp: '10:32 AM',
    isOwn: true,
    status: 'seen',
  },
  {
    id: '3',
    senderId: 'worker',
    senderName: 'Rajesh Kumar',
    content: 'Perfect! Do you have a vacuum cleaner as well? It would help with the deep cleaning.',
    timestamp: '10:35 AM',
    isOwn: false,
    status: 'seen',
  },
];

const mockPostAssignmentMessages: Message[] = [
  {
    id: '1',
    senderId: 'worker',
    senderName: 'Rajesh Kumar',
    content: "Great! I'm excited to work on this. I'll arrive at 9 AM tomorrow as discussed.",
    timestamp: '2:30 PM',
    isOwn: false,
    status: 'seen',
  },
  {
    id: '2',
    senderId: 'customer',
    senderName: 'You',
    content: "Perfect! I'll make sure to be home. The building gate code is 4521.",
    timestamp: '2:32 PM',
    isOwn: true,
    status: 'seen',
  },
  {
    id: '3',
    senderId: 'worker',
    senderName: 'Rajesh Kumar',
    content: 'Got it! Should I bring my own vacuum or will you have one available?',
    timestamp: '2:35 PM',
    isOwn: false,
    status: 'seen',
  },
  {
    id: '4',
    senderId: 'customer',
    senderName: 'You',
    content: "I have a vacuum you can use. I'll also leave out extra trash bags in the kitchen.",
    timestamp: '2:38 PM',
    isOwn: true,
    status: 'delivered',
  },
];

// ============================================
// Avatar Component
// ============================================
const ChatAvatar = ({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

// ============================================
// Simple Badge Component (for compatibility)
// ============================================
const SimpleBadge = ({ 
  variant, 
  className = '', 
  children 
}: { 
  variant?: 'outline';
  className?: string;
  children: React.ReactNode;
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = variant === 'outline' 
    ? 'border bg-transparent' 
    : '';
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

// ============================================
// Pre-Assignment Banner
// ============================================
const PreAssignmentBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-4 mt-4 p-3 rounded-xl bg-highlight/10 border border-highlight/30 dark:bg-highlight/5"
  >
    <div className="flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-highlight flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-highlight-foreground dark:text-highlight">
          Pre-assignment chat
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You're not hired yet. Use this space to ask clarifying questions only.
        </p>
      </div>
    </div>
  </motion.div>
);

// ============================================
// Chat Header
// ============================================
const ChatHeader = ({
  mode,
  choreTitle,
  otherPartyName,
  onClose,
}: {
  mode: 'pre-assignment' | 'post-assignment';
  choreTitle: string;
  otherPartyName: string;
  onClose?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <ChatAvatar name={otherPartyName} size="md" />
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{otherPartyName}</h3>
          <p className="text-xs text-muted-foreground truncate">{choreTitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {mode === 'post-assignment' ? (
          <SimpleBadge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
            In Progress
          </SimpleBadge>
        ) : (
          <SimpleBadge variant="outline" className="bg-highlight/10 text-highlight border-highlight/30 text-xs">
            Pre-assignment
          </SimpleBadge>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  </motion.div>
);

// ============================================
// Message Status Indicator
// ============================================
const MessageStatus = ({ status }: { status: Message['status'] }) => {
  if (status === 'sending') return <Clock className="w-3 h-3 text-muted-foreground" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-muted-foreground" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
  if (status === 'seen') return <CheckCheck className="w-3 h-3 text-accent" />;
  return null;
};

// ============================================
// Message Bubble
// ============================================
const MessageBubble = ({
  message,
  index,
  isPreAssignment,
}: {
  message: Message;
  index: number;
  isPreAssignment: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, delay: index * 0.05, type: 'spring', stiffness: 300 }}
    className={`flex items-end gap-2 ${message.isOwn ? 'flex-row-reverse' : ''}`}
  >
    {!message.isOwn && <ChatAvatar name={message.senderName} />}
    
    <div className={`max-w-[75%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
      {isPreAssignment && !message.isOwn && (
        <span className="text-[10px] text-muted-foreground mb-1 px-1">Pre-assignment</span>
      )}
      <div
        className={`px-4 py-2.5 rounded-2xl ${
          message.isOwn
            ? isPreAssignment
              ? 'bg-primary/70 text-primary-foreground rounded-br-md'
              : 'bg-primary text-primary-foreground rounded-br-md'
            : isPreAssignment
              ? 'bg-muted/70 text-foreground rounded-bl-md'
              : 'bg-muted text-foreground rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
      <div className={`flex items-center gap-1 mt-1 px-1 ${message.isOwn ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
        {message.isOwn && <MessageStatus status={message.status} />}
      </div>
    </div>
  </motion.div>
);

// ============================================
// Message List
// ============================================
const MessageList = ({
  messages,
  isPreAssignment,
  messagesEndRef,
  containerRef,
}: {
  messages: Message[];
  isPreAssignment: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
      {messages.length === 0 ? (
        <EmptyChatState isPreAssignment={isPreAssignment} />
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              index={index}
              isPreAssignment={isPreAssignment}
            />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

// ============================================
// Empty Chat State
// ============================================
const EmptyChatState = ({ isPreAssignment }: { isPreAssignment: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="h-full flex flex-col items-center justify-center text-center px-6 py-12"
  >
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <MessageCircle className="w-8 h-8 text-primary" />
    </div>
    <h3 className="font-semibold text-foreground mb-2">
      {isPreAssignment ? 'Start the conversation' : 'Chat with your worker'}
    </h3>
    <p className="text-sm text-muted-foreground max-w-[240px]">
      {isPreAssignment
        ? 'Ask clarifying questions about this chore before applying or hiring.'
        : "Coordinate details about the chore. You can share files, location, and more."}
    </p>
  </motion.div>
);

// ============================================
// Restrictions Notice
// ============================================
const RestrictionsNotice = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-4 mb-2 p-2.5 rounded-lg bg-muted/50 border border-border/50"
  >
    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
      <AlertCircle className="w-3 h-3" />
      Some features are disabled until the chore is assigned.
    </p>
  </motion.div>
);

// ============================================
// Attachment Bar (Post-Assignment)
// ============================================
const AttachmentBar = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-1 px-4 py-2 border-t border-border/30"
  >
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
      <Paperclip className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
      <Image className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
      <MapPin className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
      <Mic className="w-4 h-4" />
    </Button>
  </motion.div>
);

// ============================================
// Disabled Attachment Bar (Pre-Assignment)
// ============================================
const DisabledAttachmentBar = () => (
  <div className="flex items-center gap-1 px-4 py-2 border-t border-border/30">
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/40 cursor-not-allowed" disabled>
      <Paperclip className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/40 cursor-not-allowed" disabled>
      <Image className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/40 cursor-not-allowed" disabled>
      <MapPin className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/40 cursor-not-allowed" disabled>
      <Mic className="w-4 h-4" />
    </Button>
  </div>
);

// ============================================
// Message Input
// ============================================
const MessageInput = ({
  isPreAssignment,
  onSend,
  disabled = false,
}: {
  isPreAssignment: boolean;
  onSend: (message: string) => void;
  disabled?: boolean;
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="p-3 border-t border-border/50 bg-card/30"
      animate={{ y: isFocused ? -2 : 0 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className={`flex items-end gap-2 p-2 rounded-xl border transition-all duration-200 ${
        isFocused 
          ? 'border-primary/50 bg-background shadow-sm ring-2 ring-primary/10' 
          : 'border-border/50 bg-background/50'
      }`}>
        {!isPreAssignment && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-5 h-5" />
          </Button>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isPreAssignment ? 'Ask a clarifying question…' : 'Type a message…'}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground min-h-[36px] max-h-[120px] py-2"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="submit"
            size="sm"
            className={`h-9 w-9 p-0 rounded-lg flex-shrink-0 transition-all ${
              message.trim()
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground'
            }`}
            disabled={disabled || !message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.form>
  );
};

// ============================================
// Completion Card (Post-Assignment)
// ============================================
const CompletionCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-4 mb-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Ready to complete?</span>
      </div>
      <Button size="sm" className="bg-primary text-primary-foreground text-xs h-8">
        Mark as Completed
      </Button>
    </div>
  </motion.div>
);

// ============================================
// Main Chat Panel Component
// ============================================
export function ChatPanel({
  mode,
  choreId,
  currentUserId,
  choreTitle = 'Deep Clean 3-Bedroom Apartment',
  otherPartyName = 'Rajesh Kumar',
  isOpen = true,
  onClose,
}: ChatPanelProps) {
  const toast = useToast();
  const isPreAssignment = mode === 'pre-assignment';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format timestamp for display
  const formatTimestamp = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // Format as date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  // Convert API message to UI message
  const apiMessageToUIMessage = (apiMsg: ApiMessage): Message => {
    return {
      id: apiMsg.id,
      senderId: apiMsg.fromUserId,
      senderName: apiMsg.fromUser.name,
      content: apiMsg.content,
      timestamp: formatTimestamp(apiMsg.createdAt),
      createdAt: apiMsg.createdAt,
      isOwn: apiMsg.fromUserId === currentUserId,
      status: 'seen', // Default to seen for fetched messages
    };
  };

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${choreId}`);
      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have access, don't show error
          return;
        }
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      const uiMessages = (data.messages || []).map(apiMessageToUIMessage);
      setMessages(uiMessages);
      // Mark initial load as complete after first successful fetch
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Don't show toast on initial load errors
      if (!loading) {
        toast.error('Failed to load messages', 'Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [choreId, currentUserId, loading, toast]);

  // Initial fetch on mount
  useEffect(() => {
    if (isOpen && choreId) {
      fetchMessages();
    }
  }, [choreId, isOpen]); // Only fetch when choreId or isOpen changes

  // Auto-scroll to bottom when new messages arrive (only after initial load and if user is near bottom)
  // This scrolls INSIDE the chat container only, NOT the whole page
  useEffect(() => {
    // Skip auto-scroll on initial load to prevent page jumping
    if (isInitialLoad.current || !containerRef.current || messages.length === 0 || loading) {
      return;
    }

    // Check if user is already near the bottom of the chat container (within 100px)
    const container = containerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Only auto-scroll INSIDE the chat container if user is near bottom
    // Use scrollTop directly instead of scrollIntoView to avoid page-level scrolling
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  // Polling for real-time updates
  useEffect(() => {
    if (isOpen && choreId && !loading) {
      // Poll every 2.5 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, 2500);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [isOpen, choreId, loading, fetchMessages]);

  // Send message handler
  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      content: text.trim(),
      timestamp: 'Just now',
      isOwn: true,
      status: 'sending',
    };

    // Add optimistic message
    setMessages(prev => [...prev, optimisticMessage]);
    setSending(true);

    try {
      const response = await fetch(`/api/chat/${choreId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await response.json();
      
      // Remove optimistic message and add real one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
        return [...filtered, apiMessageToUIMessage(data.message)];
      });

      // Immediately refetch to get latest messages
      await fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', error.message || 'Please try again.');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden shadow-lg"
    >
      <ChatHeader
        mode={mode}
        choreTitle={choreTitle}
        otherPartyName={otherPartyName}
        onClose={onClose}
      />

      {isPreAssignment && <PreAssignmentBanner />}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading messages...</div>
        </div>
      ) : (
        <MessageList 
          messages={messages} 
          isPreAssignment={isPreAssignment}
          messagesEndRef={messagesEndRef}
          containerRef={containerRef}
        />
      )}

      {!isPreAssignment && <CompletionCard />}

      {isPreAssignment ? <RestrictionsNotice /> : null}
      {isPreAssignment ? <DisabledAttachmentBar /> : <AttachmentBar />}

      <MessageInput isPreAssignment={isPreAssignment} onSend={handleSend} disabled={sending} />
    </motion.div>
  );
}

export default ChatPanel;

