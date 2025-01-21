"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ThumbsUp, Eye } from "lucide-react";
import type { KnowledgeArticle, ArticleCategory } from "@/types";
import { api } from "@/lib/api";

interface ArticleListProps {
  onArticleSelect: (articleId: string) => void;
  selectedCategory?: string;
  showAuthor?: boolean;
  showMetrics?: boolean;
}

export function ArticleList({
  onArticleSelect,
  selectedCategory,
  showAuthor = true,
  showMetrics = true,
}: ArticleListProps) {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const articlesData = await api.getArticles({
          category: selectedCategory,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          status: 'published',
          search: searchQuery || undefined,
        });
        setArticles(articlesData);
      } catch (error) {
        console.error('Failed to load articles:', error);
      }
      setLoading(false);
    };

    loadArticles();
  }, [selectedCategory, selectedTags, searchQuery]);

  // Get unique tags from all articles
  const allTags = Array.from(
    new Set(articles.flatMap(article => article.tags))
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {allTags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No articles found matching your criteria
            </CardContent>
          </Card>
        ) : (
          articles.map(article => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onArticleSelect(article.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {article.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {article.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                  {article.content}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    {showMetrics && (
                      <>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.helpfulCount}
                        </span>
                      </>
                    )}
                  </div>
                  {showAuthor && (
                    <div className="flex items-center gap-2">
                      <span>By {article.author}</span>
                      <span>•</span>
                      <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 