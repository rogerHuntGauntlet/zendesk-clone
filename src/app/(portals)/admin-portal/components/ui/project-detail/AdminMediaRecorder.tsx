import { useState, useRef, useCallback, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Dialog } from '@headlessui/react';

interface AdminMediaRecorderProps {
  ticketId: string;
  onRecordingComplete: (url: string, type: 'audio' | 'video' | 'screen') => Promise<void>;
  recordingType: 'audio' | 'video' | 'screen';
}

export function AdminMediaRecorder({ ticketId, onRecordingComplete, recordingType }: AdminMediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const supabase = createClientComponentClient();

  const startRecording = useCallback(async (type: 'audio' | 'video' | 'screen') => {
    try {
      let stream: MediaStream;

      switch (type) {
        case 'audio':
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          break;
        case 'video':
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
          setShowVideoPreview(true);
          break;
        case 'screen':
          // Get screen stream
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });

          // Get audio stream
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });

          // Combine the streams
          const tracks = [
            ...screenStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
          ];
          stream = new MediaStream(tracks);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
          setShowVideoPreview(true);
          break;
        default:
          throw new Error('Invalid recording type');
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: type === 'audio' ? 'audio/webm' : 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: type === 'audio' ? 'audio/webm' : 'video/webm'
        });

        try {
          const fileName = `${ticketId}-${type}-${Date.now()}.webm`;
          const { data, error } = await supabase.storage
            .from('zen_admin_recordings')
            .upload(fileName, blob);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('zen_admin_recordings')
            .getPublicUrl(fileName);

          // Save activity record
          await supabase.from('zen_ticket_activities').insert({
            ticket_id: ticketId,
            activity_type: type,
            media_url: publicUrl,
            metadata: {
              duration: recordingTime,
              fileSize: blob.size
            }
          });

          await onRecordingComplete(publicUrl, type);
          toast.success(`${type} recording saved`);
        } catch (error) {
          console.error('Error saving recording:', error);
          toast.error('Failed to save recording');
        }

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (type === 'video') {
          setShowVideoPreview(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
      setShowVideoPreview(false);
    }
  }, [ticketId, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={() => startRecording('audio')}
            disabled={isRecording}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Record Audio
          </button>

          <button
            onClick={() => startRecording('video')}
            disabled={isRecording}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Record Video
          </button>

          <button
            onClick={() => startRecording('screen')}
            disabled={isRecording}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Record Screen + Audio
          </button>
        </div>

        {isRecording && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white">
                Recording {recordingType} ({formatTime(recordingTime)})
              </span>
            </div>
            
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop Recording
            </button>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <Dialog
        open={showVideoPreview}
        onClose={() => !isRecording && setShowVideoPreview(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          
          <Dialog.Panel className="relative bg-gray-900 rounded-lg p-4 max-w-2xl w-full mx-4">
            <div className="relative">
              <video
                ref={videoPreviewRef}
                className="w-full rounded-lg bg-black"
                muted
                autoPlay
                playsInline
              />
              
              {isRecording && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black/70 rounded-full px-6 py-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white">Recording ({formatTime(recordingTime)})</span>
                    </div>
                    
                    <button
                      onClick={stopRecording}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop Recording
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 