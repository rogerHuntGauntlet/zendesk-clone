import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { XMarkIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTaskTracking } from '@/app/hooks/useTaskTracking';
import TaskTrackingModal from './TaskTrackingModal';

interface TicketMessage {
  content: string;
  type: string;
  metadata?: {
    effectiveness_score?: number;
  };
  created_at: string;
}

interface TicketActivity {
  activity_type: string;
  content: string;
  created_at: string;
  metadata: any;
}

interface TicketSummary {
  summary: string;
  ai_session_data: any;
  created_at: string;
}

interface ProspectData {
  name: string;
  company: string;
  role: string;
  email: string;
}

interface OutreachContext {
  prospect: ProspectData;
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    metadata: Record<string, any>;
  };
  interactions: {
    messages: TicketMessage[];
    activities: TicketActivity[];
    summaries: TicketSummary[];
  };
  projectContext?: {
    name: string;
    description: string;
    status: string;
  };
  additionalContext?: string;
  audioContext?: {
    url: string;
  };
}

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
}

interface DatabaseTicketMessage {
  id: string;
  content: string;
  source: string;
  created_at: string;
  metadata: any;
}

interface DatabaseTicketActivity {
  id: string;
  activity_type: string;
  content: string;
  created_at: string;
  metadata: any;
}

interface DatabaseTicketSummary {
  id: string;
  summary: string;
  created_by: string | null;
  created_by_role: string;
  created_at: string;
}

interface RequiredFieldsFormData {
  [key: string]: string;
}

interface TaskTracker {
  taskName: string;
  status: 'pending' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

interface TaskUpdate {
  event: 'task_started' | 'task_completed' | 'task_error';
  task: TaskTracker;
}

interface TaskEventData {
  type: 'started' | 'completed' | 'failed';
  task: {
    taskName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    error?: string;
  };
}

// Add cache hook at the top level before the component
function useMessageCache() {
  const cache = useRef(new Map());
  
  const getCachedMessage = useCallback((key: string) => {
    return cache.current.get(key);
  }, []);

  const setCachedMessage = useCallback((key: string, value: any) => {
    cache.current.set(key, {
      value,
      timestamp: Date.now()
    });
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return { getCachedMessage, setCachedMessage, clearCache };
}

export default function OutreachModal({ isOpen, onClose, ticket }: OutreachModalProps) {
  const [mode, setMode] = useState<'single' | 'sequence'>('single');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<RequiredFieldsFormData>({});
  const [showForm, setShowForm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  
  const supabase = createClientComponentClient();
  const { getCachedMessage, setCachedMessage, clearCache } = useMessageCache();

  const {
    tasks,
    totalDuration,
    isModalOpen: isTaskModalOpen,
    handleTaskUpdate,
    resetTasks,
    openModal: openTaskModal,
    closeModal: closeTaskModal
  } = useTaskTracking();

  const lastEventTimeRef = useRef<number>(Date.now());

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setGeneratedMessage('');
      setMetadata(null);
      setProgress('');
      setError(null);
      setAudioUrl(null);
      setAdditionalContext('');
      closeTaskModal();
    }
  }, [isOpen, closeTaskModal]);

  // Log ticket and prospect data only when modal is open
  useEffect(() => {
    if (isOpen && ticket) {
      console.log('Ticket data received:', {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category
      });
      
      const prospectData = ticket?.metadata?.prospect_data;
      console.log('Prospect data:', {
        name: prospectData?.name,
        company: prospectData?.company,
        role: prospectData?.role,
        email: prospectData?.email
      });
    }
  }, [isOpen, ticket]);

  // Add ticket info display component
  const renderTicketInfo = () => {
    return (
      <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10">
        <div className="space-y-2">
          {/* Title */}
          <div>
            <h2 className="text-white font-medium">{ticket?.title || 'N/A'}</h2>
            <p className="text-white/70 text-sm line-clamp-2 mt-1">{ticket?.description || 'No description available'}</p>
          </div>

          {/* Status badges row */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
              ticket?.status === 'open' ? 'bg-green-100 text-green-800' :
              ticket?.status === 'closed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {ticket?.status || 'N/A'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
              ticket?.priority === 'high' ? 'bg-red-100 text-red-800' :
              ticket?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ticket?.priority || 'N/A'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
              {ticket?.category || 'N/A'}
            </span>
            <span className="text-white/60 ml-auto">
              Created: {ticket?.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
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
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Memoize context preparation
  const preparedContext = useMemo(() => {
    if (!ticket) return null;
    return {
      prospect: ticket?.metadata?.prospect_data,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category || 'general',
        metadata: ticket.metadata || {}
      },
      interactions: {
        messages: ticket?.zen_ticket_messages || [],
        activities: ticket?.zen_ticket_activities || [],
        summaries: ticket?.zen_ticket_summaries || []
      },
      projectContext: ticket?.zen_projects ? {
        name: ticket.zen_projects.name,
        description: ticket.zen_projects.description,
        status: ticket.zen_projects.status || 'active'
      } : undefined,
      additionalContext: additionalContext || undefined
    };
  }, [ticket, additionalContext]);

  // Modify generateMessage to use caching
  const generateMessage = async () => {
    if (isGenerating) {
      console.log('Already generating a message, ignoring request');
      return;
    }

    console.log('Starting message generation...');
    setIsGenerating(true);
    setError(null);
    resetTasks();
    openTaskModal();
    setGeneratedMessage('');
    setProgress('Initializing...');

    let eventSource: EventSource | null = null;

    try {
      if (!preparedContext) {
        throw new Error('Context not ready');
      }

      const requestBody = {
        prospectId: ticket.metadata.prospect_data.email,
        messageType: 'initial',
        context: preparedContext
      };

      console.log('Making API request to /api/outreach/generate');

      const url = '/api/outreach/generate?' + new URLSearchParams({
        body: JSON.stringify(requestBody)
      });

      eventSource = new EventSource(url);
      let taskCount = 0;

      eventSource.addEventListener('task', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as TaskEventData;
          taskCount++;
          console.log(`Task ${taskCount}:`, data.task.taskName);
          
          const taskUpdate: TaskUpdate = {
            event: data.type === 'started' ? 'task_started' :
                   data.type === 'completed' ? 'task_completed' : 'task_error',
            task: {
              taskName: data.task.taskName,
              status: data.type === 'started' ? 'pending' : 
                      data.type === 'completed' ? 'completed' : 'failed',
              startTime: data.task.startTime,
              endTime: data.task.endTime,
              duration: data.task.duration,
              error: data.task.error
            }
          };
          
          handleTaskUpdate(taskUpdate);
          setProgress(`${data.task.taskName}${data.type === 'completed' ? ' ✓' : '...'}`);
        } catch (error) {
          console.error('Error parsing task event:', error);
        }
      });

      eventSource.addEventListener('complete', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          console.log('Generation complete');
          setGeneratedMessage(data.result.message);
          setMetadata(data.result.metadata);
          setProgress('Complete!');
          
          if (eventSource) {
            eventSource.close();
          }
          setIsGenerating(false);
          
          setTimeout(() => {
            closeTaskModal();
          }, 2000);
        } catch (error) {
          console.error('Error parsing complete event:', error);
          setError('Failed to parse completion data');
          if (eventSource) {
            eventSource.close();
          }
          setIsGenerating(false);
        }
      });

      eventSource.addEventListener('error', (e: Event) => {
        console.error('EventSource error:', e);
        let errorMessage = 'Connection error occurred';
        
        // Check if the error event has any data
        if (e instanceof MessageEvent && e.data) {
          try {
            const data = JSON.parse(e.data);
            errorMessage = data.error || 'Unknown error occurred';
          } catch (parseError) {
            console.error('Error parsing error event data:', parseError);
            errorMessage = 'Failed to parse error data';
          }
        }

        // Check if the connection was lost
        if (eventSource?.readyState === EventSource.CLOSED) {
          errorMessage = 'Connection was closed unexpectedly';
        }

        setError(errorMessage);
        setProgress('Failed');
        
        // Update task tracking with error
        handleTaskUpdate({
          event: 'task_error',
          task: {
            taskName: 'Message Generation',
            status: 'failed',
            startTime: lastEventTimeRef.current,
            endTime: Date.now(),
            error: errorMessage
          }
        });

        if (eventSource) {
          eventSource.close();
        }
        setIsGenerating(false);
      });

      eventSource.addEventListener('ping', () => {
        console.log('Received keepalive ping');
        lastEventTimeRef.current = Date.now();
      });

      // Add a more robust error handler for the EventSource itself
      eventSource.onerror = (e: Event) => {
        console.error('EventSource connection error:', e);
        const errorMessage = 'Failed to establish or maintain connection to the server';
        
        setError(errorMessage);
        setProgress('Connection Failed');
        
        handleTaskUpdate({
          event: 'task_error',
          task: {
            taskName: 'Server Connection',
            status: 'failed',
            startTime: lastEventTimeRef.current,
            endTime: Date.now(),
            error: errorMessage
          }
        });

        if (eventSource) {
          eventSource.close();
        }
        setIsGenerating(false);
      };

    } catch (error) {
      console.error('Setup error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setProgress('Failed');
      if (eventSource) {
        eventSource.close();
      }
      setIsGenerating(false);
    }
  };

  const saveMessageToDatabase = async (message: string, metadata: any) => {
    const { error: insertError } = await supabase
      .from('zen_ticket_messages')
      .insert({
        ticket_id: ticket.id,
        content: message,
        source: 'ai',
        metadata: {
          generation_metadata: metadata,
          mode,
          additionalContext: additionalContext || null,
          hadAudioContext: !!audioUrl,
        },
      });

    if (insertError) {
      console.error('Error storing message:', insertError);
    }
  };

  const handleFormSubmit = () => {
    // Replace placeholders with user input
    let finalMessage = generatedMessage;
    requiredFields.forEach(field => {
      const value = formData[field] || '';
      finalMessage = finalMessage.replace(field, value);
    });

    setGeneratedMessage(finalMessage);
    setShowForm(false);
    saveMessageToDatabase(finalMessage, metadata);
  };

  const handleSendEmail = async () => {
    if (!generatedMessage || !ticket?.id) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          prospectEmail: ticket.metadata?.prospect_data?.email,
          message: generatedMessage,
          subject: `Re: ${ticket.title}`,
          metadata: {
            mode,
            additionalContext: additionalContext || null,
            hadAudioContext: !!audioUrl,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email: ' + await response.text());
      }

      // Close the modal after successful send
      onClose();
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Clear cache when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearCache();
    }
  }, [isOpen, clearCache]);

  // Cleanup audio URL when modal closes
  useEffect(() => {
    if (!isOpen && audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAdditionalContext('');
    }
  }, [isOpen, audioUrl]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-2xl max-h-[80vh] bg-gray-900 text-white"
          aria-describedby="dialog-description"
        >
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-white">
              Generate a personalized message for {ticket?.metadata?.prospect_data?.name || 'the prospect'}
            </DialogTitle>
            <DialogDescription id="dialog-description" className="text-sm text-gray-400">
              Generate an outreach message for {ticket?.metadata?.prospect_data?.name} ({ticket?.metadata?.prospect_data?.role} at {ticket?.metadata?.prospect_data?.company})
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* Add Ticket Info Display */}
            {renderTicketInfo()}

            <div className="mt-4 flex gap-2">
              <Button
                variant={mode === 'single' ? 'default' : 'outline'}
                onClick={() => setMode('single')}
                className={mode === 'single' ? 'bg-violet-600' : ''}
              >
                Single Message
              </Button>
              <Button
                variant={mode === 'sequence' ? 'default' : 'outline'}
                onClick={() => setMode('sequence')}
                className={mode === 'sequence' ? 'bg-violet-600' : ''}
              >
                Create Sequence
              </Button>
            </div>

            {/* Initial content */}
            <div className="mt-6 space-y-6">
              {!isGenerating && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Additional Context (Optional)
                    </label>
                    <Textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="Add any specific details, requirements, or context for this outreach message..."
                      className="w-full h-32 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Voice Notes (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 ${isRecording ? 'bg-red-500/20 text-red-300' : 'text-black bg-white hover:bg-gray-100'}`}
                      >
                        {isRecording ? (
                          <>
                            <StopIcon className="w-5 h-5" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <MicrophoneIcon className="w-5 h-5" />
                            Record Context
                          </>
                        )}
                      </Button>
                      {audioUrl && (
                        <audio controls src={audioUrl} className="flex-1" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {isGenerating && (
                <div className="bg-white/5 rounded-lg p-4 mb-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    <span className="text-white/80 font-medium">{progress}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full animate-pulse" />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {!isGenerating && !generatedMessage && (
                <div className="flex justify-center">
                  <Button
                    onClick={generateMessage}
                    className="bg-violet-600 hover:bg-violet-700 w-full"
                  >
                    Generate {mode === 'sequence' ? 'Sequence' : 'Message'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {generatedMessage && (
            <>
              {/* Header for generated view */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white">Generated Message</h3>
                  <p className="text-sm text-gray-400">
                    Review and send your personalized outreach message
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white"
                  aria-label="Close dialog"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Two-column layout */}
              <div className="flex-1 grid grid-cols-2 gap-6 mt-4 h-[calc(90vh-120px)]">
                {/* Left Column - Message */}
                <div className="flex flex-col h-full">
                  <div className="flex-1 bg-black rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white/80 mb-2">Generated Message:</h4>
                    <Textarea
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                      className="w-full h-[calc(100%-30px)] bg-black text-white border-white/20 focus:border-violet-500 focus:ring-violet-500 resize-none overflow-y-auto"
                    />
                  </div>
                  <DialogFooter className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMessage);
                      }}
                      className="bg-gray-700 text-white hover:bg-gray-600"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/outreach/analyze', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              message: generatedMessage,
                              context: {
                                prospect: ticket?.metadata?.prospect_data,
                                ticket: {
                                  id: ticket.id,
                                  title: ticket.title,
                                  description: ticket.description,
                                }
                              }
                            }),
                          });
                          
                          if (!response.ok) {
                            throw new Error('Analysis failed');
                          }
                          
                          const result = await response.json();
                          setMetadata({
                            ...metadata,
                            analysis: result.analysis
                          });
                        } catch (error) {
                          console.error('Error analyzing message:', error);
                          setError('Failed to analyze message');
                        }
                      }}
                      className="bg-gray-700 text-white hover:bg-gray-600"
                    >
                      Rescore
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setGeneratedMessage('');
                        generateMessage();
                      }}
                      className="bg-gray-700 text-white hover:bg-gray-600"
                    >
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>

                {/* Right Column - Analysis and Metadata */}
                <div className="space-y-4 overflow-y-auto h-full pr-2">
                  {/* Prospect Info */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-white/80 mb-3">Prospect Details</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Name:</dt>
                        <dd className="col-span-2 text-white">{ticket?.metadata?.prospect_data?.name || 'N/A'}</dd>
                      </div>
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Company:</dt>
                        <dd className="col-span-2 text-white">{ticket?.metadata?.prospect_data?.company || 'N/A'}</dd>
                      </div>
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Role:</dt>
                        <dd className="col-span-2 text-white">{ticket?.metadata?.prospect_data?.role || 'N/A'}</dd>
                      </div>
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Email:</dt>
                        <dd className="col-span-2 text-white">{ticket?.metadata?.prospect_data?.email || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Ticket Metadata */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-white/80 mb-3">Ticket Details</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Status:</dt>
                        <dd className="col-span-2 text-white">{ticket?.status || 'N/A'}</dd>
                      </div>
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Priority:</dt>
                        <dd className="col-span-2 text-white">{ticket?.priority || 'N/A'}</dd>
                      </div>
                      <div className="grid grid-cols-3">
                        <dt className="text-white/60">Category:</dt>
                        <dd className="col-span-2 text-white">{ticket?.category || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Analysis Stats */}
                  {metadata?.analysis && (
                    <>
                      <div className="bg-gray-900 rounded-lg p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-white/80 mb-3">Message Analysis</h4>
                        <dl className="space-y-2">
                          <div className="grid grid-cols-3">
                            <dt className="text-white/60">Overall Score:</dt>
                            <dd className="col-span-2 text-white font-medium">
                              {(metadata.analysis.overallScore * 100).toFixed(1)}%
                            </dd>
                          </div>
                          {Object.entries(metadata.analysis.scores).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3">
                              <dt className="text-white/60 capitalize">{key}:</dt>
                              <dd className="col-span-2 text-white">
                                {(Number(value) * 100).toFixed(1)}%
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div className="bg-gray-900 rounded-lg p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-white/80 mb-3">Analysis Details</h4>
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-white/60 text-sm mb-2">Strengths:</h5>
                            <ul className="list-disc list-inside space-y-1 text-white text-sm">
                              {metadata.analysis.strengths.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-white/60 text-sm mb-2">Improvements:</h5>
                            <ul className="list-disc list-inside space-y-1 text-white text-sm">
                              {metadata.analysis.improvements.map((improvement: string, i: number) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Add error display in the UI */}
          {isGenerating && error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <XMarkIcon className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">{error}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isOpen && isTaskModalOpen && (
        <TaskTrackingModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
          tasks={tasks}
          totalDuration={totalDuration}
        />
      )}
    </>
  );
} 