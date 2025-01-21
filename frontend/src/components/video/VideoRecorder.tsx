import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Monitor, StopCircle, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
  className?: string;
}

export function VideoRecorder({ onVideoRecorded, className }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingType, setRecordingType] = React.useState<"camera" | "screen" | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const startRecording = async (type: "camera" | "screen") => {
    try {
      let mediaStream: MediaStream;
      
      if (type === "camera") {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } else {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
      }

      setStream(mediaStream);
      setRecordingType(type);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onVideoRecorded(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stream, previewUrl]);

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Video Preview */}
        {(isRecording || previewUrl) && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full"
              src={previewUrl || undefined}
            />
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Recording
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isRecording && !previewUrl && (
            <>
              <Button
                variant="outline"
                onClick={() => startRecording("camera")}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Record Video
              </Button>
              <Button
                variant="outline"
                onClick={() => startRecording("screen")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Share Screen
              </Button>
            </>
          )}

          {isRecording && (
            <Button
              variant="destructive"
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Stop Recording
            </Button>
          )}

          {previewUrl && !isRecording && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewUrl(null);
                  setRecordingType(null);
                }}
              >
                Record New
              </Button>
              <a
                href={previewUrl}
                download="recording.webm"
                className="inline-flex"
              >
                <Button variant="outline">
                  Download
                </Button>
              </a>
            </>
          )}
        </div>
      </div>
    </Card>
  );
} 