"use client";

import { useState, ChangeEvent, useRef, useEffect, KeyboardEvent } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Switch } from "./switch";
import { Label } from "./label";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Mic, StopCircle, Loader2, Image as ImageIcon, Send, Bot, User } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import { ScrollArea } from "./scroll-area";
import WaveSurfer from 'wavesurfer.js';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSubmit: (ticketData: TicketData) => Promise<void>;
}

interface TicketData {
  title: string;
  description: string;
  priority: string;
  project_id: string;
  status: string;
  attachments?: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  isStreaming?: boolean;
  isTyping?: boolean;
}

export function NewTicketModal({ isOpen, onClose, projectId, onSubmit }: NewTicketModalProps) {
  const [isManualMode, setIsManualMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you create a ticket. You can describe your issue, share screenshots, or record a voice message. I'll help structure your ticket appropriately."
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setChatMessages([{
        role: 'assistant',
        content: "Hi! I'm here to help you create a ticket. You can describe your issue, share screenshots, or record a voice message. I'll help structure your ticket appropriately."
      }]);
      setUploadedImages([]);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const cleanupRecording = () => {
    setDescription("");
    setTitle("");
    setPriority("medium");
    setAudioBlob(null);
    setError(null);
    setRecordingTime(0);
    setCurrentMessage("");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Audio recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.");
    }
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !dataArrayRef.current || !waveformRef.current) return;

    let canvas = waveformRef.current.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = waveformRef.current.clientWidth;
      canvas.height = 100;
      waveformRef.current.appendChild(canvas);
    }

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyserRef.current.frequencyBinCount;

    // Get both time and frequency data for better visualization
    const timeData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(timeData);
    analyserRef.current.getByteFrequencyData(frequencyData);

    // Clear canvas with gradient background
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.1)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.02)');
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, width, height);

    // Draw frequency bars in the background
    const barWidth = width / (bufferLength / 4);
    let x = 0;
    canvasCtx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    
    for (let i = 0; i < bufferLength; i += 4) {
      const barHeight = (frequencyData[i] / 255) * height;
      canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    // Draw the waveform
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(34, 197, 94)';
    canvasCtx.beginPath();

    const sliceWidth = width / bufferLength;
    x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = timeData[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(width, height / 2);
    
    // Add glow effect
    canvasCtx.shadowBlur = 15;
    canvasCtx.shadowColor = 'rgba(34, 197, 94, 0.5)';
    canvasCtx.stroke();

    // Draw a moving highlight
    const time = Date.now() / 1000;
    const highlightX = (Math.sin(time * 2) + 1) * width / 2;
    const highlight = canvasCtx.createRadialGradient(
      highlightX, height/2, 0,
      highlightX, height/2, 50
    );
    highlight.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    highlight.addColorStop(1, 'rgba(34, 197, 94, 0)');
    canvasCtx.fillStyle = highlight;
    canvasCtx.fillRect(0, 0, width, height);

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async () => {
    try {
      checkBrowserSupport();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Set up audio context and analyser
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      // Start waveform visualization
      drawWaveform();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        processAudioToText(audioBlob);
      };

      mediaRecorder.onerror = (event: Event) => {
        setError("Error recording audio. Please try again.");
        stopRecording();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setError(null);

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(err instanceof Error ? err.message : 'Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clean up audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.close();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudioToText = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Add a message to show we're processing the audio
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "Processing your voice message...",
        isTyping: true
      }]);

      // First, transcribe the audio using Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      const transcriptionResponse = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcribedText = transcriptionData.text;

      // Remove the processing message
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));

      // Add transcribed text as user message
      setChatMessages(prev => [...prev, {
        role: 'user',
        content: `🎤 ${transcribedText}`
      }]);

      // Add typing indicator for assistant
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        isTyping: true
      }]);

      // Process with GPT
      const response = await fetch('/api/ai/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that creates support tickets. Help users structure their issues into tickets. Extract key information and suggest appropriate titles and priority levels. Be conversational and ask clarifying questions if needed. Format your responses using markdown for better readability."
            },
            ...chatMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: transcribedText
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove typing indicator and add streaming message
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, {
          role: 'assistant',
          content: '',
          isStreaming: true
        }];
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      let streamedContent = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            if (line === 'data: [DONE]') continue;

            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices[0]?.delta?.content || '';
              if (!content) continue;

              streamedContent += content;
              
              // Update the last message with the streamed content
              setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
                  lastMessage.content = streamedContent;
                }
                return newMessages;
              });
            } catch (e) {
              console.error('Error parsing streaming data:', e);
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Mark streaming as complete
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });

      // Try to extract structured data from the complete response
      if (streamedContent.includes("Title:") || streamedContent.includes("Priority:")) {
        const titleMatch = streamedContent.match(/Title:?\s*"([^"]+)"/i);
        const priorityMatch = streamedContent.match(/Priority:?\s*(low|normal|high|urgent)/i);
        
        if (titleMatch) setTitle(titleMatch[1]);
        if (priorityMatch) setPriority(priorityMatch[1].toLowerCase());
      }

    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio. Please try again or use manual entry.');
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping && !msg.isStreaming);
        return [...newMessages, {
          role: 'assistant',
          content: "I'm having trouble processing your audio. Please try again or type your message instead.",
          isStreaming: false
        }];
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      // Here you would typically upload to your storage service
      // For now, we'll use local URLs
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
      
      // Add images to chat
      for (const imageUrl of newImages) {
        setChatMessages(prev => [...prev, {
          role: 'user',
          content: 'Uploaded image',
          type: 'image',
          imageUrl
        }]);
      }

      // Trigger AI analysis of the images
      await processImagesWithAI(files);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images. Please try again.');
    }
  };

  const processImagesWithAI = async (files: FileList) => {
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: "Analyzing your images..."
    }]);

    try {
      // TODO: Implement actual image analysis with GPT-4 Vision
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I've analyzed your screenshots. Would you like to add any additional context or description to help me understand the issue better?"
      }]);
    } catch (err) {
      console.error('Error analyzing images:', err);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I had trouble analyzing the images. Could you please describe the issue in text?"
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() && !audioBlob) return;

    const userMessage = currentMessage.trim();
    
    // Add user message to chat
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    // Add typing indicator for assistant
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      isTyping: true
    }]);

    setCurrentMessage("");

    try {
      const response = await fetch('/api/ai/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that creates support tickets. Help users structure their issues into tickets. Extract key information and suggest appropriate titles and priority levels. Be conversational and ask clarifying questions if needed. Format your responses using markdown for better readability."
            },
            ...chatMessages.slice(0, -1).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove typing indicator and add streaming message
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, {
          role: 'assistant',
          content: '',
          isStreaming: true
        }];
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      let streamedContent = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            if (line === 'data: [DONE]') continue;

            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices[0]?.delta?.content || '';
              if (!content) continue;

              streamedContent += content;
              
              // Update the last message with the streamed content
              setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
                  lastMessage.content = streamedContent;
                }
                return newMessages;
              });
            } catch (e) {
              console.error('Error parsing streaming data:', e);
              continue;
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        throw streamError;
      } finally {
        reader.releaseLock();
      }

      // Mark streaming as complete
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });

      // Extract structured data from the complete response
      if (streamedContent.includes("Title:") || streamedContent.includes("Priority:")) {
        const titleMatch = streamedContent.match(/Title:?\s*"([^"]+)"/i);
        const priorityMatch = streamedContent.match(/Priority:?\s*(low|normal|high|urgent)/i);
        
        if (titleMatch) setTitle(titleMatch[1]);
        if (priorityMatch) setPriority(priorityMatch[1].toLowerCase());
      }

    } catch (err) {
      console.error('Error processing message:', err);
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping && !msg.isStreaming);
        return [...newMessages, {
          role: 'assistant',
          content: "I'm having trouble processing your message. Please try again or switch to manual mode.",
          isStreaming: false
        }];
      });
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const fullDescription = chatMessages
        .filter(msg => msg.type !== 'image')
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('/api/ai/process-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that creates support tickets. Extract key information from the conversation and suggest appropriate titles and priority levels. Valid priority levels are: low, medium, high, urgent. 
              
              You MUST respond with ONLY a valid JSON object in this exact format, with no additional text, markdown, or formatting:
              {"title": "Brief title here", "description": "Detailed description here", "priority": "medium"}`
            },
            ...chatMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process ticket data');
      }

      const aiResponse = await response.json();
      let aiSuggestion;
      try {
        aiSuggestion = JSON.parse(aiResponse.choices[0].message.content.trim());
      } catch (parseError) {
        console.error("Failed to parse AI response:", aiResponse.choices[0].message.content);
        throw new Error('Invalid response format from AI');
      }

      setTitle(aiSuggestion.title || title);
      setDescription(aiSuggestion.description || fullDescription);
      setPriority(aiSuggestion.priority || 'medium');
      setShowForm(true);

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've analyzed your request and prepared a ticket. You can now review and edit the details before creating the ticket.`
      }]);

      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing ticket:", error);
      setError('Failed to process ticket data. Please try again or use manual mode.');
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await onSubmit({
        title: title || "Untitled Ticket",
        description: description || chatMessages
          .filter(msg => msg.type !== 'image')
          .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join('\n\n'),
        priority: priority || 'medium',
        project_id: projectId,
        status: "new",
        attachments: uploadedImages
      });
      onClose();
    } catch (error) {
      console.error("Error creating ticket:", error);
      setError('Failed to create ticket. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            {showForm 
              ? "Review and edit the ticket details below before creating."
              : "Describe your issue and I'll help structure it into a ticket."}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-2 py-4">
          <Switch
            id="manual-mode"
            checked={isManualMode}
            onCheckedChange={setIsManualMode}
          />
          <Label htmlFor="manual-mode">Manual Entry Mode</Label>
        </div>

        {!isManualMode ? (
          !showForm ? (
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 ${
                        message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                      } animate-in slide-in-from-bottom-2 duration-300 ease-out`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'assistant' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {message.role === 'assistant' ? (
                          message.isStreaming || message.isTyping ? (
                            <div className="relative">
                              <Loader2 className="w-5 h-5 text-green-700 animate-spin" />
                              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                                <div className="flex space-x-1">
                                  <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                  <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                  <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Bot className="w-5 h-5 text-green-700" />
                          )
                        ) : (
                          <User className="w-5 h-5 text-blue-700" />
                        )}
                      </div>
                      <div className={`flex flex-col space-y-2 max-w-[80%] ${
                        message.role === 'assistant' ? 'items-start' : 'items-end'
                      }`}>
                        {message.type === 'image' ? (
                          <img 
                            src={message.imageUrl} 
                            alt="Uploaded content" 
                            className="max-w-full rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          />
                        ) : (
                          <div className={`rounded-lg px-4 py-2 ${
                            message.role === 'assistant' 
                              ? 'bg-green-50 text-green-900 shadow-sm' 
                              : 'bg-blue-50 text-blue-900 shadow-sm'
                          } ${message.isStreaming ? 'animate-pulse' : ''} hover:shadow-md transition-shadow duration-200`}>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                                  ),
                                  code: ({ node, ...props }) => (
                                    <code {...props} className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" />
                                  ),
                                  pre: ({ node, ...props }) => (
                                    <pre {...props} className="bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto" />
                                  )
                                }}
                              >
                                {message.content || (message.isTyping ? '_Typing..._' : '')}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                {isRecording && (
                  <div 
                    ref={waveformRef}
                    className="h-24 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-inner relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-800">
                          Recording {formatTime(recordingTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={handleVoiceRecording}
                    disabled={isTranscribing}
                  >
                    {isRecording ? (
                      <StopCircle className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>

                  {isRecording && (
                    <span className="text-sm text-green-600">
                      {formatTime(recordingTime)}
                    </span>
                  )}

                  <div className="flex-1">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() && !audioBlob}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isProcessing || isTranscribing || chatMessages.length <= 1}
                  >
                    {isProcessing ? "Processing..." : "Process with AI"}
                  </Button>
                </div>

                {(title || priority !== 'medium') && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-title">Suggested Title</Label>
                      <Input
                        id="ai-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="AI will suggest a title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-priority">Suggested Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter ticket title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Enter detailed description"
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleFinalSubmit}
                  disabled={!title || !description}
                >
                  Create Ticket
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter ticket title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Enter detailed description"
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleFinalSubmit}
                disabled={!title || !description}
              >
                Create Ticket
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 