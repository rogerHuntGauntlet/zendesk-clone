import { v4 as uuidv4 } from 'uuid';

// Mock EventEmitter for WebSocket simulation
class MockEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  removeAllListeners() {
    this.listeners = {};
  }
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'system';
  sender: {
    id: string;
    name: string;
    type: 'ai' | 'agent' | 'user';
  };
  reactions?: {
    [emoji: string]: {
      emoji: string;
      users: string[];
    };
  };
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size?: number;
  }>;
  replyTo?: Message;
}

export interface Chat {
  id: string;
  messages: Message[];
  participants: string[];
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    name: string;
    type: 'ai' | 'agent' | 'user';
    status?: 'online' | 'offline' | 'away';
  };
  lastMessage?: Message;
  unreadCount?: number;
  typing?: boolean;
}

class ChatAPI {
  private chats: Map<string, Chat> = new Map();
  private wsEmitter: MockEventEmitter = new MockEventEmitter();

  constructor() {
    // Initialize with mock data
    const mockChat: Chat = {
      id: uuidv4(),
      messages: [
        {
          id: uuidv4(),
          content: "Hello! How can I help you today?",
          senderId: "agent",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: "text",
          sender: {
            id: "agent",
            name: "Support Agent",
            type: "agent"
          }
        },
        {
          id: uuidv4(),
          content: "I'm having trouble with my account settings",
          senderId: "client-1",
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          type: "text",
          sender: {
            id: "client-1",
            name: "Roger",
            type: "user"
          }
        },
        {
          id: uuidv4(),
          content: "I'll help you with that. What specific settings are you trying to change?",
          senderId: "agent",
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          type: "text",
          sender: {
            id: "agent",
            name: "Support Agent",
            type: "agent"
          }
        }
      ],
      participants: ["client-1", "agent"],
      status: "active",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3000000).toISOString(),
      participant: {
        id: "agent",
        name: "Support Agent",
        type: "agent",
        status: "online"
      },
      unreadCount: 0,
      typing: false
    };

    this.chats.set(mockChat.id, mockChat);
  }

  getWebSocket() {
    return this.wsEmitter;
  }

  async createChat(participantIds: string[]): Promise<Chat> {
    const chat: Chat = {
      id: uuidv4(),
      messages: [],
      participants: participantIds,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participant: {
        id: participantIds[0],
        name: participantIds[0] === 'agent' ? 'Support Agent' : 'Roger',
        type: participantIds[0] === 'agent' ? 'agent' : 'user'
      },
      unreadCount: 0,
      typing: false
    };

    this.chats.set(chat.id, chat);
    return chat;
  }

  async sendMessage(chatId: string, content: string, senderId: string): Promise<Message> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const message: Message = {
      id: uuidv4(),
      content,
      senderId,
      timestamp: new Date().toISOString(),
      type: 'text',
      sender: {
        id: senderId,
        name: senderId === 'agent' ? 'Support Agent' : 'Roger',
        type: senderId === 'agent' ? 'agent' : 'user'
      }
    };

    chat.messages.push(message);
    chat.lastMessage = message;
    chat.updatedAt = new Date().toISOString();
    this.chats.set(chatId, chat);

    // Emit typing indicator before agent response
    if (senderId !== 'agent') {
      this.wsEmitter.emit('typing', { chatId, isTyping: true });
      setTimeout(() => {
        this.wsEmitter.emit('typing', { chatId, isTyping: false });
        this.sendAgentResponse(chatId);
      }, 1000);
    }

    return message;
  }

  private async sendAgentResponse(chatId: string) {
    const responses = [
      "I'll help you with that right away.",
      "Let me check that for you.",
      "I understand your concern. How can I assist you further?",
      "Thank you for providing that information. Let me look into it.",
      "Is there anything else you'd like to know?",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    await this.sendMessage(chatId, randomResponse, 'agent');
  }

  async getChat(chatId: string): Promise<Chat | undefined> {
    return this.chats.get(chatId);
  }

  async getChatHistory(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(chat => 
      chat.participants.includes(userId)
    );
  }

  async getChats(): Promise<Chat[]> {
    // Return all chats for now, in a real implementation this would be filtered by user/permissions
    return Array.from(this.chats.values());
  }

  async closeChat(chatId: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.status = 'closed';
      this.chats.set(chatId, chat);
    }
  }

  async markAsRead(chatId: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.unreadCount = 0;
      this.chats.set(chatId, chat);
    }
  }

  async uploadAttachment(chatId: string, file: File): Promise<any> {
    // Mock implementation - in a real app this would upload to storage
    return {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      size: file.size
    };
  }

  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (!chat) return;

    const message = chat.messages.find(m => m.id === messageId);
    if (!message) return;

    if (!message.reactions) {
      message.reactions = {};
    }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = {
        emoji,
        users: []
      };
    }

    if (!message.reactions[emoji].users.includes('client-1')) {
      message.reactions[emoji].users.push('client-1');
    }

    this.chats.set(chat.id, chat);
  }

  async removeReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (!chat) return;

    const message = chat.messages.find(m => m.id === messageId);
    if (!message || !message.reactions || !message.reactions[emoji]) return;

    message.reactions[emoji].users = message.reactions[emoji].users.filter(
      userId => userId !== 'client-1'
    );

    if (message.reactions[emoji].users.length === 0) {
      delete message.reactions[emoji];
    }

    if (Object.keys(message.reactions).length === 0) {
      delete message.reactions;
    }

    this.chats.set(chat.id, chat);
  }
}

export const chatApi = new ChatAPI(); 