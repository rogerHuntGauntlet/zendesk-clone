"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { templateSharing, type TemplateApprovalStatus } from '@/lib/template-sharing';
import { wsService } from '@/lib/websocket';
import type { Employee } from '@/types';

interface SharedTemplatesProps {
  currentUser: Employee;
  isReviewer?: boolean;
}

export function SharedTemplates({ currentUser, isReviewer = false }: SharedTemplatesProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [activeTab, setActiveTab] = useState('shared');

  useEffect(() => {
    loadTemplates();
    
    // Subscribe to template updates
    const unsubscribe = wsService.subscribe((event) => {
      if (event.type === 'TEMPLATE_UPDATE') {
        switch (event.payload.action) {
          case 'shared':
          case 'review_completed':
          case 'effectiveness_updated':
            loadTemplates();
            break;
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const loadTemplates = async () => {
    try {
      const shared = await templateSharing.getSharedTemplatesForUser(currentUser.id);
      setTemplates(shared);
    } catch (error) {
      console.error('Error loading shared templates:', error);
      toast({
        title: "Error",
        description: "Failed to load shared templates",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (templateId: string, sharedWith: string[]) => {
    try {
      await templateSharing.shareTemplate(templateId, currentUser.id, sharedWith);
      toast({
        title: "Success",
        description: "Template shared successfully",
      });
    } catch (error) {
      console.error('Error sharing template:', error);
      toast({
        title: "Error",
        description: "Failed to share template",
        variant: "destructive",
      });
    }
  };

  const handleReview = async (status: TemplateApprovalStatus) => {
    if (!selectedTemplate) return;

    try {
      await templateSharing.reviewTemplate(
        selectedTemplate.id,
        currentUser.id,
        status,
        reviewComment
      );

      setShowReviewDialog(false);
      setReviewComment('');
      setSelectedTemplate(null);

      toast({
        title: "Success",
        description: `Template ${status}`,
      });
    } catch (error) {
      console.error('Error reviewing template:', error);
      toast({
        title: "Error",
        description: "Failed to review template",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: TemplateApprovalStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (activeTab === 'shared') {
      return template.sharedBy === currentUser.id;
    } else if (activeTab === 'received') {
      return template.sharedWith.includes(currentUser.id);
    } else if (activeTab === 'pending' && isReviewer) {
      return template.approvalStatus === 'pending';
    }
    return false;
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shared">Shared by Me</TabsTrigger>
          <TabsTrigger value="received">Shared with Me</TabsTrigger>
          {isReviewer && (
            <TabsTrigger value="pending">
              Pending Review
              {templates.filter(t => t.approvalStatus === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {templates.filter(t => t.approvalStatus === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates Shared by Me</CardTitle>
              <CardDescription>
                View and manage templates you've shared with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="mb-4">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Shared with {template.sharedWith.length} team members
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getStatusColor(template.approvalStatus)}>
                              {template.approvalStatus}
                            </Badge>
                            {template.effectiveness && (
                              <Badge variant="secondary">
                                Used {template.effectiveness.usageCount} times
                              </Badge>
                            )}
                          </div>
                        </div>
                        {template.effectiveness && (
                          <div className="text-right text-sm">
                            <p>Success Rate: {Math.round(template.effectiveness.successRate * 100)}%</p>
                            <p>Avg Response Time: {template.effectiveness.avgResponseTime}s</p>
                            {template.effectiveness.avgSatisfactionScore > 0 && (
                              <p>Satisfaction: {template.effectiveness.avgSatisfactionScore.toFixed(1)}/5</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates Shared with Me</CardTitle>
              <CardDescription>
                View and use templates shared by your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="mb-4">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Shared by: {template.sharedBy}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getStatusColor(template.approvalStatus)}>
                              {template.approvalStatus}
                            </Badge>
                          </div>
                        </div>
                        {template.approvalStatus === 'approved' && (
                          <Button variant="outline" size="sm">
                            Use Template
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {isReviewer && (
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates Pending Review</CardTitle>
                <CardDescription>
                  Review and approve shared templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {filteredTemplates.map(template => (
                    <Card key={template.id} className="mb-4">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Shared by: {template.sharedBy}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">
                                Pending Review
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowReviewDialog(true);
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate && (
              <>
                <div>
                  <Label>Template Name</Label>
                  <p className="text-sm">{selectedTemplate.name}</p>
                </div>
                <div>
                  <Label>Content</Label>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedTemplate.versions.find(
                        (v: any) => v.id === selectedTemplate.currentVersion
                      )?.content}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <Label htmlFor="comment">Review Comment</Label>
                  <Textarea
                    id="comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add your review comments..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReview('rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleReview('approved')}
                  >
                    Approve
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 