"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Button } from './button';
import { MessageCircle, Bot, Send } from 'lucide-react';
import { createClient } from '../../lib/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projects?: Project[];
  portal: string;
}

interface TeamMember {
  id: string;
  name: string | null;
  role: string;
  last_active: string | null;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

interface ProjectContext {
  project: Project | null;
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

export function ChatModal({ isOpen, onClose, projectId, projects, portal }: ChatModalProps) {
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectId);
  const [onlineTeamMembers, setOnlineTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'select' | 'ai' | 'agent'>('select');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    project: null,
    tickets: [],
    loading: false,
    error: null
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch project context when starting AI chat
  useEffect(() => {
    if (chatMode === 'ai' && selectedProject) {
      fetchProjectContext(selectedProject);
    }
  }, [chatMode, selectedProject]);

  const fetchProjectContext = async (projectId: string) => {
    setProjectContext(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('zen_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch project tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('zen_tickets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      setProjectContext({
        project,
        tickets: tickets || [],
        loading: false,
        error: null
      });

      // Add initial AI message with context
      const contextMessage = generateContextMessage(project, tickets || []);
      setMessages([{
        id: Date.now().toString(),
        content: contextMessage,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);

    } catch (err: any) {
      console.error('Error fetching project context:', err);
      setProjectContext(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load project context'
      }));
    }
  };

  const generateContextMessage = (project: Project, tickets: Ticket[]): string => {
    const activeTickets = tickets.filter(t => t.status !== 'closed').length;
    const recentTickets = tickets.slice(0, 3); // Get 3 most recent tickets

    return `Hello! I'm your AI assistant for the project "${project.name}". 
    
${project.description}

Current project status:
• ${activeTickets} active tickets
${recentTickets.length > 0 ? '\nRecent tickets:' : ''}
${recentTickets.map(t => `• ${t.title} (${t.status})`).join('\n')}

How can I help you with this project today?`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Generate AI response based on project context
    const projectInfo = projectContext.project;
    const tickets = projectContext.tickets;
    
    setTimeout(() => {
      let aiResponse = "I understand you're asking about ";
      
      if (projectInfo) {
        aiResponse += `the project "${projectInfo.name}". `;
        
        // Add relevant ticket information if the message mentions tickets or status
        if (newMessage.toLowerCase().includes('ticket') || newMessage.toLowerCase().includes('status')) {
          const activeTickets = tickets.filter(t => t.status !== 'closed');
          aiResponse += `\n\nCurrently, there are ${activeTickets.length} active tickets in this project. `;
          
          if (activeTickets.length > 0) {
            aiResponse += `The most recent active ticket is "${activeTickets[0].title}".`;
          }
        }
      }

      aiResponse += "\n\nHow else can I assist you with this project?";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const isOnline = (lastActive: string | null) => {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    return new Date(lastActive) > fiveMinutesAgo;
  };

  useEffect(() => {
    if (!selectedProject) {
      setOnlineTeamMembers([]);
      setLoading(false);
      return;
    }

    const fetchTeamMembers = async () => {
      setLoading(true);
      setError(null);

      try {
        // First get all project members with admin or employee roles
        const { data: projectMembers, error: membersError } = await supabase
          .from('zen_project_members')
          .select('user_id, role')
          .eq('project_id', selectedProject)
          .in('role', ['admin', 'employee']);

        if (membersError) throw membersError;
        if (!projectMembers?.length) {
          setOnlineTeamMembers([]);
          return;
        }

        // Then get the user details for these members
        const userIds = projectMembers.map(member => member.user_id);
        const { data: users, error: usersError } = await supabase
          .from('auth.users')
          .select('id, name, last_active')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Combine the data and filter for online members
        const members = projectMembers.map(member => {
          const user = users?.find(u => u.id === member.user_id);
          return {
            id: member.user_id,
            name: user?.name || 'Unknown User',
            role: member.role,
            last_active: user?.last_active || null
          };
        }).filter(member => isOnline(member.last_active));

        setOnlineTeamMembers(members);
      } catch (err: any) {
        console.error('Error fetching team members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();

    // Set up real-time subscription for user status updates
    const userIds = onlineTeamMembers.map(m => m.id);
    const statusSubscription = supabase
      .channel('user-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'auth',
          table: 'users',
          filter: userIds.length ? `id=in.(${userIds.join(',')})` : undefined,
        },
        (payload) => {
          const updatedUser = payload.new as { id: string; last_active: string };
          setOnlineTeamMembers(prev => 
            prev.map(member => 
              member.id === updatedUser.id
                ? { ...member, last_active: updatedUser.last_active }
                : member
            ).filter(member => isOnline(member.last_active))
          );
        }
      )
      .subscribe();

    return () => {
      statusSubscription.unsubscribe();
    };
  }, [selectedProject, supabase]);

  const renderChatInterface = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-full">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">AI Assistant</div>
            <div className="text-sm text-gray-500">Always available to help</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setChatMode('select');
            setMessages([]);
          }}
        >
          Back
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 my-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Welcome to AI Support!</p>
            <p className="text-sm">How can I assist you today?</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div 
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-2">
                <span className="text-white text-sm">You</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button 
            onClick={handleSendMessage}
            className="rounded-full px-4 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] max-h-[800px] p-0 gap-0">
        {chatMode === 'ai' ? (
          renderChatInterface()
        ) : (
          <div className="p-6 space-y-6">
            {projects && !projectId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Project
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProject && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Available Support Agents</h2>
                
                {loading ? (
                  <div className="text-sm text-gray-500">Loading available agents...</div>
                ) : error ? (
                  <div className="text-sm text-red-500">{error}</div>
                ) : onlineTeamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {onlineTeamMembers.map((member) => (
                      <Button
                        key={member.id}
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        variant="outline"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-full">
                            <MessageCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.role}</div>
                          </div>
                          <span className="ml-auto flex items-center text-xs text-green-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Online
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Agents Available
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Our support team is currently offline. Don't worry - our AI assistant is here to help!
                      </p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700" 
                        onClick={() => setChatMode('ai')}
                      >
                        <Bot className="w-5 h-5 mr-2" />
                        Chat with AI Assistant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}