"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "@/components/TemplateManager";
import { AIAssistant } from './AIAssistant';
import type { Ticket, Employee } from "@/types";

interface TicketResponseDialogProps {
  ticket: Ticket;
  open: boolean;
  onCloseAction: () => void;
  onSubmitAction: (content: string, attachments: File[]) => void;
  assignedEmployee?: Employee;
}

export function TicketResponseDialog({
  ticket,
  open,
  onCloseAction,
  onSubmitAction,
  assignedEmployee,
}: TicketResponseDialogProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string>("compose");
  const [showAIAssistant, setShowAIAssistant] = useState(true);

  const handleSuggestedResponseSelect = (suggestedResponse: string) => {
    setContent(current => current ? `${current}\n\n${suggestedResponse}` : suggestedResponse);
  };

  const handleArticleSelect = async (articleId: string) => {
    try {
      // In a real implementation, fetch the article content
      const articleContent = "Article content would be inserted here...";
      setContent(current => current ? `${current}\n\n${articleContent}` : articleContent);
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAction(content, attachments);
    setContent("");
    setAttachments([]);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent);
    setActiveTab("compose");
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Respond to Ticket: {ticket.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              <TabsContent value="compose">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="response">Response</Label>
                    <Textarea
                      id="response"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type your response..."
                      className="min-h-[300px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attachments">Attachments</Label>
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleAttachmentChange}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCloseAction}>
                      Cancel
                    </Button>
                    <Button type="submit">Send Response</Button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="templates">
                {assignedEmployee && (
                  <TemplateManager
                    onSelectTemplate={handleTemplateSelect}
                    showAnalytics={false}
                    currentUser={assignedEmployee}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Assistant */}
          <div>
            <AIAssistant
              ticket={ticket}
              onSuggestedResponseSelect={handleSuggestedResponseSelect}
              onArticleSelect={handleArticleSelect}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 