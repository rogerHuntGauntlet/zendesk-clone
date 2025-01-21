import { MessageSquare, AlertCircle, CheckCircle, FileText, Clock, UserCircle2, AlertTriangle, ExternalLink, Reply, Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TicketInteraction } from "@/types/tickets";
import { format, formatDistanceToNow } from "date-fns";
import { FileIcon, User2 } from "lucide-react";

interface TimelinePreviewProps {
  interaction: TicketInteraction;
  requiresAction?: boolean;
  onReply?: () => void;
  onViewDetails?: () => void;
}

export function TimelinePreview({ 
  interaction, 
  requiresAction,
  onReply,
  onViewDetails 
}: TimelinePreviewProps) {
  // Get relative time (e.g., "2 hours ago")
  const relativeTime = formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true });
  
  // Determine urgency based on time and status
  const isUrgent = requiresAction && 
    (new Date().getTime() - new Date(interaction.timestamp).getTime()) > 24 * 60 * 60 * 1000; // 24 hours

  const renderMetadata = () => {
    if (!interaction.metadata) return null;

    switch (interaction.type) {
      case 'status_change':
        return (
          <div className="text-sm text-gray-500">
            Changed status from{' '}
            <span className="font-medium">{interaction.metadata.oldValue}</span> to{' '}
            <span className="font-medium">{interaction.metadata.newValue}</span>
          </div>
        );
      case 'priority_change':
        return (
          <div className="text-sm text-gray-500">
            Changed priority from{' '}
            <span className="font-medium">{interaction.metadata.oldValue}</span> to{' '}
            <span className="font-medium">{interaction.metadata.newValue}</span>
          </div>
        );
      case 'attachment':
        return interaction.metadata.files?.map((file, index) => (
          <div key={index} className="flex items-center gap-2">
            <FileIcon className="h-4 w-4" />
            <span className="text-sm">{file.name}</span>
            {file.url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="ml-2"
              >
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            )}
          </div>
        ));
      default:
        return <div className="text-sm text-gray-600">{interaction.content}</div>;
    }
  };

  return (
    <div className="flex items-start gap-3 relative">
      {/* Icon */}
      <div className="flex-shrink-0">
        {interaction.author.avatar ? (
          <img
            src={interaction.author.avatar}
            alt={interaction.author.name}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User2 className="h-6 w-6 text-gray-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tooltip>
              <TooltipTrigger>
                <span className="font-medium text-sm truncate">{interaction.author.name}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{interaction.author.name} ({interaction.author.role})</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <time className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                {relativeTime}
              </time>
            </TooltipTrigger>
            <TooltipContent>
              <p>{format(new Date(interaction.timestamp), "PPp")}</p>
            </TooltipContent>
          </Tooltip>
          {requiresAction && (
            <Badge 
              variant={isUrgent ? "destructive" : "secondary"}
              className="text-xs animate-pulse"
            >
              {isUrgent ? 'Urgent Response Needed' : 'Action Required'}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {renderMetadata()}

          {/* File Attachments Preview */}
          {interaction.type === 'attachment' && interaction.metadata?.files && (
            <div className="flex flex-wrap gap-2">
              {interaction.metadata.files.map((file, fileIndex) => (
                <div
                  key={fileIndex}
                  className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-7 px-2 text-xs"
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                Reply
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDetails}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View Details
              </Button>
            )}
            {interaction.metadata?.url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                asChild
              >
                <a href={interaction.metadata.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open Link
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 