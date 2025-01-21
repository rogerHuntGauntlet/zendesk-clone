import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Book, ArrowRight } from "lucide-react";
import type { Ticket } from "@/types";

interface AIAssistantProps {
  ticket: Ticket;
  onSuggestedResponseSelect: (response: string) => void;
  onArticleSelect: (articleId: string) => void;
}

export function AIAssistant({
  ticket,
  onSuggestedResponseSelect,
  onArticleSelect,
}: AIAssistantProps) {
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [relevantArticles, setRelevantArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateSuggestions = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call your AI service
        const responses = [
          "Thank you for reaching out. I understand your concern about...",
          "I apologize for any inconvenience. Let me help you resolve...",
          "I've reviewed your ticket and I can assist you with...",
        ];
        setSuggestedResponses(responses);

        // Mock relevant articles
        const articles = [
          { id: '1', title: 'Common troubleshooting steps', relevance: 0.95 },
          { id: '2', title: 'Known issues and solutions', relevance: 0.85 },
          { id: '3', title: 'Quick start guide', relevance: 0.75 },
        ];
        setRelevantArticles(articles);
      } catch (error) {
        console.error('Error generating suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [ticket]);

  return (
    <div className="space-y-6">
      {/* AI Suggested Responses */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Suggested Responses
        </h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-gray-500">Generating suggestions...</span>
              </div>
            ) : (
              suggestedResponses.map((response, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => onSuggestedResponseSelect(response)}
                >
                  <span className="truncate">{response}</span>
                  <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Relevant Knowledge Base Articles */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Book className="h-5 w-5 text-blue-500" />
          Relevant Articles
        </h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-gray-500">Finding relevant articles...</span>
              </div>
            ) : (
              relevantArticles.map((article) => (
                <Button
                  key={article.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => onArticleSelect(article.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{article.title}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {Math.round(article.relevance * 100)}% match
                    </span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
} 