"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, ArrowLeft, Eye } from "lucide-react";
import type { KnowledgeArticle } from "@/types";
import { api } from "@/lib/api";

interface ArticleViewerProps {
  articleId: string;
  onBack: () => void;
}

export function ArticleViewer({ articleId, onBack }: ArticleViewerProps) {
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const articleData = await api.getArticle(articleId);
        setArticle(articleData);
        
        // Track article view in learning system
        await api.trackLearningProgress({
          type: 'article_view',
          articleId,
          userId: 'current-user', // This should come from auth context
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to load article:', error);
      }
      setLoading(false);
    };

    loadArticle();
  }, [articleId]);

  const handleFeedback = async (isHelpful: boolean) => {
    if (!article || feedbackSubmitted) return;

    try {
      await api.submitArticleFeedback({
        articleId: article.id,
        userId: 'current-user', // This should come from auth context
        isHelpful,
      });
      
      // Track article feedback in learning system
      await api.trackLearningProgress({
        type: 'article_feedback',
        articleId: article.id,
        userId: 'current-user', // This should come from auth context
        timestamp: new Date().toISOString(),
        metadata: { isHelpful }
      });
      
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading article...</div>;
  }

  if (!article) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Article not found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Articles
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {article.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>{article.viewCount} views</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {article.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Last updated {new Date(article.updatedAt).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          {/* Article content */}
          <div className="prose dark:prose-invert max-w-none">
            {article.content}
          </div>

          {/* Feedback section */}
          <div className="mt-8 pt-6 border-t">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">
                Was this article helpful?
              </h3>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleFeedback(true)}
                  disabled={feedbackSubmitted}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFeedback(false)}
                  disabled={feedbackSubmitted}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
              {feedbackSubmitted && (
                <p className="text-sm text-gray-500 mt-4">
                  Thank you for your feedback!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 