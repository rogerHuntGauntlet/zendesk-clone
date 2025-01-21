import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User as UserIcon, Users, MessageCircle, Paperclip, Mic, Plus, MoreVertical, Reply, Smile } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User } from "@/types";

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: ChatParticipant;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  reactions?: Record<string, {
    emoji: string;
    users: string[];
  }>;
  replyTo?: ChatMessage;
  edited?: boolean;
}

interface Chat {
  id: string;
  participant: ChatParticipant;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  typing?: boolean;
  unreadCount: number;
}

interface ChatParticipant {
  id: string;
  name: string;
  type: 'ai' | 'agent' | 'user';
  status?: 'online' | 'offline' | 'away';
  avatar?: string;
}

interface WebSocketEvents {
  typing: { chatId: string; isTyping: boolean };
  status_change: { participantId: string; status: ChatParticipant['status'] };
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string;
  assignedAgent?: User;
  className?: string;
  onCreateTicket?: (data: { title: string; description: string; attachments: File[] }) => Promise<void>;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export function LiveChat({ 
  isOpen, 
  onClose, 
  ticketId, 
  assignedAgent,
  className,
  onCreateTicket 
}: LiveChatProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat API for demo purposes
  const chatApi = {
    getChats: async (): Promise<Chat[]> => [],
    getTicketChat: async (id: string): Promise<Chat> => ({
      id,
      participant: assignedAgent ? {
        id: assignedAgent.id,
        name: assignedAgent.name,
        type: 'agent',
        status: 'online'
      } : {
        id: 'ai-agent',
        name: 'AI Assistant',
        type: 'ai',
        status: 'online'
      },
      messages: [],
      unreadCount: 0
    }),
    getChatHistory: async (chatId: string): Promise<ChatMessage[]> => [],
    sendMessage: async (chatId: string, content: string, replyToId?: string): Promise<ChatMessage> => ({
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: { id: 'user-1', name: 'You', type: 'user' },
      replyTo: replyToId ? {
        id: replyToId,
        content: '',
        timestamp: new Date(),
        sender: { id: 'user-1', name: 'You', type: 'user' }
      } : undefined,
      edited: false
    }),
    uploadAttachment: async (chatId: string, file: File) => ({
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      size: file.size
    }),
    markAsRead: async (chatId: string) => {},
    addReaction: async (chatId: string, messageId: string, emoji: string) => {},
    removeReaction: async (chatId: string, messageId: string, emoji: string) => {},
    getWebSocket: () => ({
      on: (event: string, callback: Function) => {},
      removeAllListeners: () => {}
    })
  };

  // Load initial data
  useEffect(() => {
    const loadChats = async () => {
      try {
        // If we have a ticketId, load that specific chat
        const loadedChats = ticketId 
          ? [await chatApi.getTicketChat(ticketId)]
          : await chatApi.getChats();
        setChats(loadedChats);
        
        // If we have a ticketId, automatically select that chat
        if (ticketId && loadedChats.length > 0) {
          setSelectedChat(loadedChats[0]);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [ticketId, assignedAgent]);

  // Set up WebSocket listeners
  useEffect(() => {
    const ws = chatApi.getWebSocket();

    ws.on('typing', ({ chatId, isTyping }: WebSocketEvents['typing']) => {
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId ? { ...chat, typing: isTyping } : chat
        )
      );
    });

    ws.on('status_change', ({ participantId, status }: WebSocketEvents['status_change']) => {
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.participant.id === participantId 
            ? { ...chat, participant: { ...chat.participant, status } }
            : chat
        )
      );
    });

    return () => {
      ws.removeAllListeners();
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  // Load chat history when selecting a chat
  useEffect(() => {
    if (selectedChat) {
      const loadHistory = async () => {
        try {
          const history = await chatApi.getChatHistory(selectedChat.id);
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === selectedChat.id ? { ...chat, messages: history } : chat
            )
          );
          await chatApi.markAsRead(selectedChat.id);
        } catch (error) {
          console.error('Failed to load chat history:', error);
        }
      };
      loadHistory();
    }
  }, [selectedChat?.id]);

  const handleFileUpload = async (files: FileList) => {
    if (!selectedChat) return;

    for (const file of Array.from(files)) {
      try {
        const attachment = await chatApi.uploadAttachment(selectedChat.id, file);
        const message = await chatApi.sendMessage(selectedChat.id, '', replyingTo?.id);
        message.attachments = [attachment];
        
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === selectedChat.id 
              ? { 
                  ...chat, 
                  messages: [...chat.messages, message],
                  lastMessage: message
                }
              : chat
          )
        );
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const message = await chatApi.sendMessage(selectedChat.id, newMessage, replyingTo?.id);
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? { 
                ...chat, 
                messages: [...chat.messages, message],
                lastMessage: message,
                typing: false
              }
            : chat
        )
      );
      
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedChat) return;

    try {
      const message = selectedChat.messages.find(m => m.id === messageId);
      if (!message) return;

      const hasReacted = message.reactions?.[emoji]?.users.includes('user-1');

      if (hasReacted) {
        await chatApi.removeReaction(selectedChat.id, messageId, emoji);
      } else {
        await chatApi.addReaction(selectedChat.id, messageId, emoji);
      }

      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? {
                ...chat,
                messages: chat.messages.map(m => 
                  m.id === messageId
                    ? {
                        ...m,
                        reactions: {
                          ...m.reactions,
                          [emoji]: {
                            emoji,
                            users: hasReacted
                              ? (m.reactions?.[emoji]?.users || []).filter(u => u !== 'user-1')
                              : [...(m.reactions?.[emoji]?.users || []), 'user-1']
                          }
                        }
                      }
                    : m
                )
              }
            : chat
        )
      );
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const message: ChatMessage = {
          id: Date.now().toString(),
          content: '',
          timestamp: new Date(),
          sender: { type: 'user', name: 'You', id: 'user-1' },
          attachments: [{
            id: Date.now().toString(),
            name: 'Voice Message',
            type: 'audio/wav',
            url: URL.createObjectURL(audioBlob),
            size: audioBlob.size
          }]
        };
        if (selectedChat) {
          selectedChat.messages.push(message);
          setChats([...chats]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCreateTicket = () => {
    if (!selectedChat) return;
    
    const chatHistory = selectedChat.messages
      .map(m => `${m.sender.name} (${new Date(m.timestamp).toLocaleString()}): ${m.content}`)
      .join('\n');

    const attachments = selectedChat.messages
      .flatMap(m => m.attachments || [])
      .map(a => new File([a.url], a.name, { type: a.type }));

    onCreateTicket?.({
      title: `Chat with ${selectedChat.participant.name}`,
      description: chatHistory,
      attachments
    });
    setCreateTicketOpen(false);
  };

  const ChatIcon = ({ type, status }: { type: ChatParticipant['type']; status?: ChatParticipant['status'] }) => {
    const Icon = type === 'ai' ? Bot : type === 'agent' ? Users : UserIcon;
    return (
      <div className="relative">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          type === 'ai' ? 'bg-blue-100 text-blue-600' :
          type === 'agent' ? 'bg-green-100 text-green-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        {status && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            status === 'online' ? 'bg-green-500' :
            status === 'away' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className={`fixed right-8 transition-all duration-300 transform ${
        isOpen ? 'bottom-32 opacity-100' : '-bottom-full opacity-0'
      } z-50 w-[800px]`}>
        <Card className="rounded-lg shadow-xl border-2 border-primary">
          <div className="h-[600px] flex">
            {/* Chat List */}
            <div className="w-72 border-r flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Messages</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {chats.map((chat) => (
                    <Button
                      key={chat.id}
                      variant={selectedChat?.id === chat.id ? "secondary" : "ghost"}
                      className="w-full justify-start px-2 py-3 h-auto relative"
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start gap-3">
                        <ChatIcon type={chat.participant.type} status={chat.participant.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{chat.participant.name}</span>
                            {chat.unreadCount > 0 && (
                              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {chat.typing && (
                              <span className="text-primary">Typing...</span>
                            )}
                            {chat.lastMessage && (
                              <p className="truncate">
                                {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-3">
                      <ChatIcon type={selectedChat.participant.type} status={selectedChat.participant.status} />
                      <div>
                        <h3 className="font-semibold">{selectedChat.participant.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedChat.typing ? 'Typing...' : 
                           selectedChat.participant.status === 'online' ? 'Online' :
                           selectedChat.participant.status === 'away' ? 'Away' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateTicketOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                      <Button variant="ghost" size="sm" onClick={onClose}>
                        ✕
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedChat.messages.map((message) => (
                        <div key={message.id} className="space-y-2">
                          {message.replyTo && (
                            <div className={`flex gap-2 items-center text-sm text-gray-500 ${
                              message.sender.type === 'user' ? 'justify-end' : ''
                            }`}>
                              <Reply className="h-3 w-3" />
                              Replying to {message.replyTo.sender.name}
                            </div>
                          )}
                          <div className={`flex gap-3 ${
                            message.sender.type === 'user' ? 'flex-row-reverse' : ''
                          }`}>
                            <ChatIcon type={message.sender.type} />
                            <div className={`max-w-[70%] ${
                              message.sender.type === 'user' ? 'text-right' : ''
                            }`}>
                              <div className="text-sm text-gray-500 mb-1">
                                {message.sender.name} •{' '}
                                {new Date(message.timestamp).toLocaleTimeString()}
                                {message.edited && ' (edited)'}
                              </div>
                              {message.content && (
                                <div className={`group relative rounded-lg p-3 ${
                                  message.sender.type === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}>
                                  {message.content}
                                  <div className={`absolute -bottom-2 ${
                                    message.sender.type === 'user' ? '-left-2' : '-right-2'
                                  } opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    <div className="flex items-center gap-1 bg-background border rounded-full p-1 shadow-lg">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setReplyingTo(message)}
                                      >
                                        <Reply className="h-3 w-3" />
                                      </Button>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                          >
                                            <Smile className="h-3 w-3" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2" align="start">
                                          <div className="flex gap-1">
                                            {EMOJI_REACTIONS.map(emoji => (
                                              <Button
                                                key={emoji}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleReaction(message.id, emoji)}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {message.reactions && Object.entries(message.reactions).length > 0 && (
                                <div className={`flex gap-1 mt-1 ${
                                  message.sender.type === 'user' ? 'justify-end' : 'justify-start'
                                }`}>
                                  {Object.entries(message.reactions).map(([emoji, reaction]) => (
                                    <Button
                                      key={emoji}
                                      variant={reaction.users.includes('user-1') ? 'secondary' : 'outline'}
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => handleReaction(message.id, emoji)}
                                    >
                                      {emoji} {reaction.users.length}
                                    </Button>
                                  ))}
                                </div>
                              )}
                              {message.attachments?.map(attachment => (
                                <div key={attachment.id} className="mt-2">
                                  {attachment.type.startsWith('image/') ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="max-w-full rounded-lg"
                                    />
                                  ) : attachment.type.startsWith('audio/') ? (
                                    <audio
                                      src={attachment.url}
                                      controls
                                      className="max-w-full"
                                    />
                                  ) : (
                                    <a
                                      href={attachment.url}
                                      download={attachment.name}
                                      className="text-primary hover:underline"
                                    >
                                      📎 {attachment.name}
                                      {attachment.size && (
                                        <span className="text-xs text-gray-500">
                                          {' '}({Math.round(attachment.size / 1024)}KB)
                                        </span>
                                      )}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Reply Banner */}
                  {replyingTo && (
                    <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Reply className="h-4 w-4" />
                        <span>
                          Replying to <span className="font-medium">{replyingTo.sender.name}</span>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach files</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={isRecording ? 'text-red-500' : ''}
                            onClick={isRecording ? stopRecording : startRecording}
                          >
                            <Mic className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isRecording ? `Recording: ${recordingTime}s` : 'Record audio'}
                        </TooltipContent>
                      </Tooltip>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${selectedChat.participant.name}...`}
                        className="flex-1"
                      />
                      <Button type="submit">Send</Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a chat to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Create Ticket Dialog */}
        <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ticket from Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p>This will create a new support ticket with the chat history and attachments.</p>
              <div className="flex justify-end">
                <Button onClick={handleCreateTicket}>
                  Create Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
} 