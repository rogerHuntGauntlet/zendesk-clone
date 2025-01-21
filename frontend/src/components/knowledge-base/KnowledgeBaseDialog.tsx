"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArticleList } from "./ArticleList";
import { ArticleViewer } from "./ArticleViewer";

interface KnowledgeBaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  articleId?: string;  // Optional: directly open a specific article
  category?: string;   // Optional: filter by category
}

export function KnowledgeBaseDialog({
  isOpen,
  onOpenChange,
  articleId,
  category,
}: KnowledgeBaseDialogProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(articleId || null);

  // Reset selected article when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArticleId(null);
    }
  }, [isOpen]);

  // Update selected article if articleId prop changes
  useEffect(() => {
    if (articleId) {
      setSelectedArticleId(articleId);
    }
  }, [articleId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedArticleId ? "Article Details" : "Knowledge Base"}
          </DialogTitle>
        </DialogHeader>

        {selectedArticleId ? (
          <ArticleViewer
            articleId={selectedArticleId}
            onBack={() => setSelectedArticleId(null)}
          />
        ) : (
          <ArticleList
            onArticleSelect={setSelectedArticleId}
            selectedCategory={category}
            showAuthor={true}
            showMetrics={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 