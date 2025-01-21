import * as React from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ResponseTemplates } from "@/components/response/ResponseTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Library } from "lucide-react";

interface TicketResponseProps {
  onSubmit: (content: string, attachments?: File[]) => void;
  placeholder?: string;
}

export function TicketResponse({ onSubmit, placeholder }: TicketResponseProps) {
  const [content, setContent] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content, attachments);
    setContent("");
    setAttachments([]);
  };

  const handleAttachmentUpload = (files: FileList) => {
    setAttachments(prev => [...prev, ...Array.from(files)]);
  };

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent);
    setIsTemplatesOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <RichTextEditor
            value={content}
            onChange={setContent}
            onAttachmentUpload={handleAttachmentUpload}
            placeholder={placeholder || "Type your response..."}
          />
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium">Attachments:</p>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span>{file.name}</span>
                  <span className="text-xs">({Math.round(file.size / 1024)} KB)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon">
                <Library className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Response Templates</DialogTitle>
              </DialogHeader>
              <ResponseTemplates onSelectTemplate={handleTemplateSelect} />
            </DialogContent>
          </Dialog>
          <Button type="submit" size="icon" disabled={!content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
} 