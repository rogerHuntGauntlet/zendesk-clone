import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Upload, FileText, CheckCircle, X, Mic, Play, Square } from "lucide-react";
import type { Ticket, TicketPriority } from "@/types";

interface CreateTicketFormProps {
  onSubmit: (ticketData: {
    title: string;
    description: string;
    priority: Ticket['priority'];
    category: string;
    attachments: File[];
  }) => Promise<Ticket>;
  onCancel: () => void;
}

export function CreateTicketForm({ onSubmit, onCancel }: CreateTicketFormProps) {
  const [isAiMode, setIsAiMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  const [ticketData, setTicketData] = useState({
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    category: "",
    attachments: [] as File[],
  });

  // Audio recording setup
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to access microphone. Please check your permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTicketData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeFile = (index: number) => {
    setTicketData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: null });

    try {
      if (isAiMode) {
        // Here you would send the description, files, and audio to your AI service
        // The AI would analyze and create appropriate title, category, and priority
        // For now, we'll simulate this with some basic values
        const aiGeneratedData = {
          title: "AI Generated: " + ticketData.description.slice(0, 50),
          description: ticketData.description,
          priority: "medium" as TicketPriority,
          category: "Technical Issue",
          attachments: [...ticketData.attachments],
        };
        if (audioBlob) {
          aiGeneratedData.attachments.push(new File([audioBlob], 'voice-recording.wav', { type: 'audio/wav' }));
        }
        await onSubmit(aiGeneratedData);
      } else {
        await onSubmit(ticketData);
      }
      onCancel();
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit ticket. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAiSubmission = () => {
    if (!ticketData.description.trim()) {
      return "Please describe your issue";
    }
    return null;
  };

  const validateManualSubmission = () => {
    if (!ticketData.title.trim()) return "Please enter a ticket title";
    if (!ticketData.category) return "Please select a category";
    if (!ticketData.description.trim()) return "Please enter a description";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-end space-x-2">
        <span className="text-sm">AI Assistant</span>
        <Switch
          checked={isAiMode}
          onCheckedChange={setIsAiMode}
        />
      </div>

      {submitStatus.message && (
        <Alert variant={submitStatus.type === 'error' ? "destructive" : "default"}>
          {submitStatus.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertTitle>
            {submitStatus.type === 'error' ? 'Error' : 'Success'}
          </AlertTitle>
          <AlertDescription>
            {submitStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {isAiMode ? (
        // AI Mode Interface
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Describe Your Issue</Label>
            <Textarea
              id="description"
              placeholder="Describe your issue in detail and our AI will help categorize and prioritize it..."
              value={ticketData.description}
              onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
              className="bg-gray-50 dark:bg-gray-700 min-h-[200px]"
            />
          </div>

          {/* Audio Recording */}
          <div className="space-y-2">
            <Label>Voice Description</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "secondary"}
                onClick={isRecording ? stopRecording : startRecording}
                className="flex items-center gap-2"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Record Voice
                  </>
                )}
              </Button>
              {audioBlob && !isRecording && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(audioBlob));
                      audio.play();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Play Recording
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAudioBlob(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attach Files</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor="attachments"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  Choose files
                </Label>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                or drag and drop files here
              </p>
            </div>
            {ticketData.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Files:</h4>
                <div className="space-y-2">
                  {ticketData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Manual Mode Interface
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of your issue"
                value={ticketData.title}
                onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={ticketData.category || undefined}
                onValueChange={(value) => setTicketData({ ...ticketData, category: value })}
              >
                <SelectTrigger id="category" className="bg-gray-50 dark:bg-gray-700">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                  <SelectItem value="Account">Account</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Feature Request">Feature Request</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={ticketData.priority}
                onValueChange={(value) => setTicketData({ ...ticketData, priority: value as Ticket["priority"] })}
              >
                <SelectTrigger id="priority" className="bg-gray-50 dark:bg-gray-700">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low - Not time sensitive</SelectItem>
                  <SelectItem value="Medium">Medium - Needs attention soon</SelectItem>
                  <SelectItem value="High">High - Urgent issue</SelectItem>
                  <SelectItem value="Critical">Critical - System down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your issue"
              value={ticketData.description}
              onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
              className="bg-gray-50 dark:bg-gray-700 min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Upload Files</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor="attachments"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  Choose files
                </Label>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                or drag and drop files here
              </p>
            </div>
            {ticketData.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Files:</h4>
                <div className="space-y-2">
                  {ticketData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Ticket'
          )}
        </Button>
      </div>
    </div>
  );
} 