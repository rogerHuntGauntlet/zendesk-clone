import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { 
  Ticket, 
  TimeEntry, 
  CostEntry, 
  MentionSuggestion, 
  ShareTicketData,
  User,
  TicketAttachment
} from "@/types";
import { TicketDetailsForm } from "./TicketDetailsForm";
import { TicketTimeline } from "./TicketTimeline";
import { LiveChat } from "./LiveChat";
import { ShareTicketDialog } from "@/components/tickets/ShareTicketDialog";
import { AlertCircle, MessageSquare, Paperclip, FileText, MessageCircleIcon, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TicketDialogProps {
  ticket: Ticket;
  isOpen: boolean;
  isUpdating: boolean;
  attachments: File[];
  mentionSuggestions: MentionSuggestion[];
  users: User[];
  onOpenChange: (open: boolean) => void;
  onUpdate: (ticketId: string, data: Partial<Ticket>) => void;
  onAttachmentAdd: (files: FileList) => void;
  onAttachmentRemove: (index: number) => void;
  onAddComment: (ticketId: string, comment: string, isInternal?: boolean, mentions?: string[]) => void;
  onShare?: (ticketId: string, data: ShareTicketData) => void;
}

export function TicketDialog({
  ticket,
  isOpen,
  isUpdating,
  attachments,
  mentionSuggestions,
  users,
  onOpenChange,
  onUpdate,
  onAttachmentAdd,
  onAttachmentRemove,
  onAddComment,
  onShare,
}: TicketDialogProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [chatView, setChatView] = useState<'live' | 'history'>('live');

  const handleClose = () => {
    onOpenChange(false);
  };

  const unreadMessages = ticket.interactions?.filter(
    i => i.type === 'comment' && !i.isInternal
  ).length || 0;

  const assignedAgent = users.find(u => u.id === ticket.assignedTo);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Ticket #{ticket.id}</span>
            {ticket.priority === "high" || ticket.priority === "critical" ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : null}
            <Badge variant={ticket.status === 'closed' ? 'secondary' : 'default'}>
              {ticket.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {ticket.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircleIcon className="h-4 w-4" />
              Chat
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="details" className="h-full">
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <div className="space-y-6">
                  {/* Ticket Details Form */}
                  <TicketDetailsForm
                    ticket={ticket}
                    attachments={attachments}
                    isUpdating={isUpdating}
                    onUpdate={onUpdate}
                    onCancel={handleClose}
                    onAttachmentAdd={onAttachmentAdd}
                    onAttachmentRemove={onAttachmentRemove}
                  />

                  <Separator />

                  {/* Attachments Section */}
                  {(attachments.length > 0 || ticket.attachments?.length > 0) && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {ticket.attachments?.map((attachment: TicketAttachment, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm truncate">{attachment.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAttachmentRemove(index)}
                            >
                              <span className="sr-only">Remove</span>
                              ×
                            </Button>
                          </div>
                        ))}
                        {attachments.map((file, index) => (
                          <div
                            key={`new-${index}`}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAttachmentRemove(index)}
                            >
                              <span className="sr-only">Remove</span>
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chat" className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {assignedAgent && (
                      <div className="text-sm text-muted-foreground">
                        Assigned to: <span className="font-medium">{assignedAgent.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={chatView === 'live' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChatView('live')}
                    >
                      <MessageCircleIcon className="h-4 w-4 mr-2" />
                      Live Chat
                    </Button>
                    <Button
                      variant={chatView === 'history' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChatView('history')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Button>
                  </div>
                </div>

                {chatView === 'live' ? (
                  <LiveChat
                    isOpen={true}
                    onClose={() => {}}
                    ticketId={ticket.id}
                    assignedAgent={assignedAgent}
                    className="flex-1"
                  />
                ) : (
                  <ScrollArea className="flex-1">
                    <TicketTimeline
                      interactions={ticket.interactions}
                      onAddComment={onAddComment ? (comment, isInternal, mentions) => 
                        onAddComment(ticket.id, comment, isInternal, mentions) : undefined}
                      mentionSuggestions={mentionSuggestions}
                    />
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {onShare && (
                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  Share Ticket
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {onShare && (
        <ShareTicketDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          onShare={(data) => onShare(ticket.id, data)}
          users={users}
        />
      )}
    </Dialog>
  );
} 