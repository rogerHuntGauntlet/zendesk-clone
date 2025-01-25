"use client";

import { useState, useRef, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { Button } from "./button";
import { Send, Bot, User, HelpCircle, BookOpen, MessageSquare, Image as ImageIcon, Mic, StopCircle, Loader2 } from "lucide-react";
import { Card } from "./card";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Badge } from "./badge";
import { format } from "date-fns";
import WaveSurfer from 'wavesurfer.js';

interface TicketDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  projectId: string;
}

interface Message {
  id: string;
  content: string;
  source: 'client' | 'agent' | 'ai';
  created_at: string;
  created_by: string;
  metadata?: {
    recommendations?: Array<{
      title: string;
      url: string;
      relevance: number;
    }>;
    knowledge_base?: Array<{
      title: string;
      path: string;
      relevance: number;
    }>;
    type?: 'text' | 'image' | 'audio';
    mediaUrl?: string;
  };
  isLoading?: boolean;
}

interface TicketDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to?: {
    name: string;
  };
}

interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
}

export function TicketDetailView({ isOpen, onClose, ticketId, projectId }: TicketDetailViewProps) {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingInterval = useRef<NodeJS.Timeout>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      const { data, error } = await supabase
        .from('zen_tickets')
        .select(`
          *,
          assigned_to:zen_users!zen_tickets_assigned_to_fkey(
            name
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Error fetching ticket details:', error);
        return;
      }

      setTicketDetails(data);
    };

    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId, supabase]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('zen_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`zen_ticket_messages:${ticketId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'zen_ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        }, 
        (payload: RealtimePostgresChangesPayload<Message>) => {
          setMessages(current => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  // Initialize audio recording
  useEffect(() => {
    const initializeRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          audioChunks.current.push(e.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          audioChunks.current = [];
        };

        setMediaRecorder(recorder);
      } catch (err) {
        console.error('Error initializing audio recording:', err);
      }
    };

    initializeRecording();
  }, []);

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTime(time => time + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create a signed URL for upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(`${ticketId}/${Date.now()}-${file.name}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(uploadData.path);

      // Save message with image
      const { error: messageError } = await supabase
        .from('zen_ticket_messages')
        .insert([
          {
            ticket_id: ticketId,
            content: `Uploaded ${file.type.startsWith('image/') ? 'image' : 'audio'}: ${file.name}`,
            source: 'client',
            metadata: {
              type: file.type.startsWith('image/') ? 'image' : 'audio',
              mediaUrl: publicUrl
            }
          }
        ]);

      if (messageError) throw messageError;

    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessageContent = currentMessage;
    setCurrentMessage(""); // Clear input immediately
    setIsProcessing(true);
    setError(null);

    try {
      // Save and display user message immediately
      const { data: userMessage, error: saveError } = await supabase
        .from('zen_ticket_messages')
        .insert([{
          ticket_id: ticketId,
          content: userMessageContent,
          source: 'client'
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      // Start streaming indicator
      const tempId = Date.now().toString();
      setStreamingMessage({
        id: tempId,
        content: '',
        isComplete: false
      });

      // Process with AI
      const response = await fetch('/api/process-ticket-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          projectId,
          message: userMessageContent
        }),
      });

      if (!response.ok) throw new Error('Failed to process message with AI');

      const aiResponse = await response.json();

      // Save AI response
      const { error: aiError } = await supabase
        .from('zen_ticket_messages')
        .insert([{
          ticket_id: ticketId,
          content: aiResponse.content,
          source: 'ai',
          metadata: {
            recommendations: aiResponse.recommendations || [],
            knowledge_base: aiResponse.knowledgeBase || []
          }
        }]);

      if (aiError) throw aiError;
      setStreamingMessage(null);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setStreamingMessage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update scroll behavior
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  // Scroll on new messages
  useEffect(() => {
    // Small delay to ensure content is rendered
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  // Scroll on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 200); // Longer delay for modal open
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 flex-shrink-0 border-b">
          <DialogTitle>
            {ticketDetails?.title || 'Loading...'}
          </DialogTitle>
          {ticketDetails && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <Badge 
                  variant={ticketDetails.status === 'resolved' ? 'default' : 'outline'}
                  className={
                    ticketDetails.status === 'resolved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'border-green-200 text-green-700'
                  }
                >
                  {ticketDetails.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Updated {format(new Date(ticketDetails.updated_at), "MMM d, h:mm a")}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span>Priority: {ticketDetails.priority}</span>
                {ticketDetails.assigned_to && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Assigned to: {ticketDetails.assigned_to.name}</span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-700 mt-2 border-t pt-2">
                {ticketDetails.description}
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.source === 'client' ? 'justify-end' : 'justify-start'
                  } w-full`}
                >
                  {message.source !== 'client' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
                      <Bot className="w-5 h-5 text-green-700" />
                    </div>
                  )}

                  <div className={`flex flex-col space-y-2 max-w-[85%] ${
                    message.source === 'client' ? 'items-end' : 'items-start'
                  }`}>
                    <div className={`rounded-lg px-4 py-2 break-words w-full ${
                      message.source === 'client'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.metadata?.type === 'image' ? (
                        <img 
                          src={message.metadata?.mediaUrl} 
                          alt="Uploaded content"
                          className="max-w-full rounded-lg"
                        />
                      ) : message.metadata?.type === 'audio' ? (
                        <audio 
                          src={message.metadata?.mediaUrl} 
                          controls 
                          className="w-full"
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none overflow-x-hidden">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {(message.metadata?.recommendations || []).length > 0 && (
                      <Card className="p-3 w-full bg-blue-50/50">
                        <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                          <HelpCircle className="w-4 h-4" />
                          Helpful Resources
                        </h4>
                        <ul className="space-y-1">
                          {(message.metadata?.recommendations || []).map((rec, idx) => (
                            <li key={idx} className="break-words">
                              <a
                                href={rec.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline line-clamp-2"
                              >
                                {rec.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {(message.metadata?.knowledge_base || []).length > 0 && (
                      <Card className="p-3 w-full bg-green-50/50">
                        <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                          <BookOpen className="w-4 h-4" />
                          From the Knowledge Base
                        </h4>
                        <ul className="space-y-1">
                          {(message.metadata?.knowledge_base || []).map((item, idx) => (
                            <li key={idx} className="break-words">
                              <a
                                href={item.path}
                                className="text-sm text-green-600 hover:underline line-clamp-2"
                              >
                                {item.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </div>

                  {message.source === 'client' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                      <User className="w-5 h-5 text-blue-700" />
                    </div>
                  )}
                </div>
              ))}

              {streamingMessage && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
                    <Loader2 className="w-5 h-5 text-green-700 animate-spin" />
                  </div>
                  <div className="flex flex-col space-y-2 max-w-[75%]">
                    <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>AI is thinking</span>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isProcessing}
                className="flex-1"
              />
              <div className="flex-shrink-0 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isProcessing}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={isRecording ? 'animate-pulse bg-red-50' : ''}
                >
                  {isRecording ? (
                    <StopCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={isProcessing || !currentMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {isRecording && (
              <div className="mt-2 text-sm text-gray-500">
                Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}