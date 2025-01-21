import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { MessageSquare, AlertCircle, CheckCircle, FileText, Clock, UserCircle2, X } from "lucide-react";
import type { TicketInteraction, MentionSuggestion } from "@/types/tickets";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MentionsInput } from "@/components/mentions/MentionsInput";

interface TicketTimelineProps {
  interactions?: TicketInteraction[];
  onAddComment?: (comment: string, isInternal: boolean, mentions: string[]) => void;
  mentionSuggestions?: MentionSuggestion[];
}

export function TicketTimeline({ 
  interactions = [], 
  onAddComment,
  mentionSuggestions = []
}: TicketTimelineProps) {
  const [showInternalNotes, setShowInternalNotes] = useState(true);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [activeMentions, setActiveMentions] = useState<string[]>([]);

  const visibleInteractions = interactions.filter(interaction => 
    showInternalNotes || !interaction.isInternal
  );

  const handleCommentSubmit = () => {
    if (onAddComment && newComment.trim()) {
      onAddComment(newComment, isInternalNote, activeMentions);
      setNewComment('');
      setActiveMentions([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={showInternalNotes}
            onCheckedChange={setShowInternalNotes}
            id="show-internal-notes"
          />
          <Label htmlFor="show-internal-notes">Show Internal Notes</Label>
        </div>
      </div>

      {onAddComment && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={isInternalNote}
              onCheckedChange={setIsInternalNote}
              id="is-internal-note"
            />
            <Label htmlFor="is-internal-note">Internal Note</Label>
          </div>
          <div className="flex gap-2">
            <MentionsInput
              value={newComment}
              onChange={(value, mentions) => {
                setNewComment(value);
                setActiveMentions(mentions);
              }}
              placeholder="Add a comment or internal note... Use @ to mention someone"
              className="flex-1"
              suggestions={mentionSuggestions}
            />
            <Button
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {visibleInteractions.map((interaction) => (
          <div
            key={interaction.id}
            className={cn(
              "p-4 rounded-lg",
              interaction.isInternal ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-gray-50 dark:bg-gray-800/50"
            )}
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={interaction.author.avatar} />
                <AvatarFallback>{interaction.author.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{interaction.author.name}</span>
                  {interaction.author.role && (
                    <Badge variant="outline">{interaction.author.role}</Badge>
                  )}
                  {interaction.isInternal && (
                    <Badge variant="secondary">Internal Note</Badge>
                  )}
                  <span className="text-sm text-gray-500">
                    {new Date(interaction.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="mt-2">
                  {interaction.type === 'comment' || interaction.type === 'internal_note' ? (
                    <p>{interaction.content}</p>
                  ) : interaction.type === 'status_change' ? (
                    <p>
                      Changed status from{' '}
                      <span className="font-medium">{interaction.metadata?.oldValue}</span>
                      {' '}to{' '}
                      <span className="font-medium">{interaction.metadata?.newValue}</span>
                    </p>
                  ) : interaction.type === 'attachment' && interaction.metadata?.files ? (
                    <div className="space-y-2">
                      <p>{interaction.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {interaction.metadata.files.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1 rounded"
                          >
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>{interaction.content}</p>
                  )}

                  {interaction.metadata?.mentions && interaction.metadata.mentions.length > 0 && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">
                        Mentioned: {interaction.metadata.mentions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 