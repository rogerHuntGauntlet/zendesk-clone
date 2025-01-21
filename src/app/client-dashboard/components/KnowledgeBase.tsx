import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Video, FileText, ArrowRight } from 'lucide-react';

interface KnowledgeBaseProps {
  suggestedArticleId?: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  type: 'article' | 'video' | 'guide';
  content: string;
  tags: string[];
  lastUpdated: string;
}

interface TypeIconProps {
  type: Article['type'];
  className?: string;
}

const TypeIcon = ({ type, className }: TypeIconProps) => {
  switch (type) {
    case 'video':
      return <Video className={className} />;
    case 'guide':
      return <FileText className={className} />;
    default:
      return <BookOpen className={className} />;
  }
};

// Mock data - replace with actual API calls
const MOCK_ARTICLES: Article[] = [
  {
    id: "kb-1",
    title: "Getting Started with Our Platform",
    category: "Getting Started",
    type: "article",
    content: "Welcome to our platform! This guide will walk you through the essential steps to get started. First, we will cover account setup, basic navigation, and key features you will use daily. You will learn how to create your first ticket, use the dashboard, and customize your preferences.",
    tags: ["setup", "introduction", "basics", "new user"],
    lastUpdated: "2024-03-20"
  },
  {
    id: "kb-2",
    title: "Common Issues and Solutions",
    category: "Troubleshooting",
    type: "guide",
    content: "This comprehensive guide addresses the most frequently encountered issues and their solutions. Learn how to resolve login problems, handle ticket submission errors, and fix common integration issues. Includes step-by-step troubleshooting procedures.",
    tags: ["issues", "help", "problems", "fixes"],
    lastUpdated: "2024-03-19"
  },
  {
    id: "kb-3",
    title: "Video Tutorial: Advanced Features",
    category: "Tutorials",
    type: "video",
    content: "https://example.com/video",
    tags: ["advanced", "tutorial", "features", "video guide"],
    lastUpdated: "2024-03-18"
  },
  {
    id: "kb-4",
    title: "Best Practices for Ticket Management",
    category: "Best Practices",
    type: "article",
    content: "Learn how to effectively manage your support tickets. This guide covers prioritization strategies, response time optimization, and ticket organization techniques. Perfect for team leads and support managers.",
    tags: ["tickets", "management", "organization", "efficiency"],
    lastUpdated: "2024-03-17"
  },
  {
    id: "kb-5",
    title: "Security Guidelines and Recommendations",
    category: "Security",
    type: "guide",
    content: "Essential security practices for using our platform. Covers password policies, two-factor authentication, secure file sharing, and data protection guidelines.",
    tags: ["security", "protection", "privacy", "authentication"],
    lastUpdated: "2024-03-16"
  },
  {
    id: "kb-6",
    title: "Video: Customizing Your Dashboard",
    category: "Tutorials",
    type: "video",
    content: "https://example.com/dashboard-customization",
    tags: ["dashboard", "customization", "personalization"],
    lastUpdated: "2024-03-15"
  },
  {
    id: "kb-7",
    title: "Integration Guide: API Overview",
    category: "Technical",
    type: "guide",
    content: "Complete guide to our API integration. Includes authentication methods, endpoint documentation, rate limits, and common integration patterns.",
    tags: ["api", "integration", "development", "technical"],
    lastUpdated: "2024-03-14"
  },
  {
    id: "kb-8",
    title: "Automated Workflows Setup",
    category: "Advanced Features",
    type: "article",
    content: "Learn how to create and manage automated workflows. This guide covers trigger conditions, action configuration, and best practices for automation.",
    tags: ["automation", "workflows", "efficiency"],
    lastUpdated: "2024-03-13"
  },
  {
    id: "kb-9",
    title: "Video: Advanced Search Techniques",
    category: "Tutorials",
    type: "video",
    content: "https://example.com/advanced-search",
    tags: ["search", "filters", "advanced"],
    lastUpdated: "2024-03-12"
  },
  {
    id: "kb-10",
    title: "Team Collaboration Features",
    category: "Team Management",
    type: "article",
    content: "Discover how to effectively use our collaboration features. Learn about team assignments, shared inboxes, internal notes, and coordination tools.",
    tags: ["collaboration", "team", "communication"],
    lastUpdated: "2024-03-11"
  },
  {
    id: "kb-11",
    title: "Reporting and Analytics Guide",
    category: "Analytics",
    type: "guide",
    content: "Master our reporting tools. Learn how to generate custom reports, analyze trends, and make data-driven decisions using our analytics dashboard.",
    tags: ["reports", "analytics", "metrics", "data"],
    lastUpdated: "2024-03-10"
  },
  {
    id: "kb-12",
    title: "Mobile App Features",
    category: "Mobile",
    type: "article",
    content: "Everything you need to know about our mobile app. Covers installation, features, offline capabilities, and mobile-specific functionality.",
    tags: ["mobile", "app", "ios", "android"],
    lastUpdated: "2024-03-09"
  }
];

const CATEGORIES = [
  "All",
  "Getting Started",
  "Troubleshooting",
  "Tutorials",
  "Best Practices",
  "Security",
  "Technical",
  "Advanced Features",
  "Team Management",
  "Analytics",
  "Mobile",
  "FAQs"
];

export function KnowledgeBase({ suggestedArticleId }: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(
    suggestedArticleId 
      ? MOCK_ARTICLES.find(a => a.id === suggestedArticleId) || null
      : null
  );

  const filteredArticles = MOCK_ARTICLES.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-[80vh]">
      {/* Left Panel - Search and Categories */}
      <div className="w-[200px] border-r border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-1">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 px-2">Categories</h3>
          <div className="space-y-0.5">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                className="w-full justify-between text-sm h-8 px-2"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                {selectedCategory === category && <ArrowRight className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Panel - Articles List */}
      {(selectedCategory !== "All" || searchQuery !== "") && (
        <div className="w-[280px] border-r border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 px-2">
            {searchQuery ? "Search Results" : selectedCategory}
          </h3>
          <div className="space-y-1">
            {filteredArticles.map(article => (
              <Button
                key={article.id}
                variant="ghost"
                className={`w-full justify-start text-sm h-auto py-2 px-2 ${
                  selectedArticle?.id === article.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-start gap-2">
                  <TypeIcon type={article.type} className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-left line-clamp-2">{article.title}</span>
                </div>
              </Button>
            ))}
            {filteredArticles.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-2">
                No articles found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Right Panel - Article Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedArticle ? (
          <article className="prose dark:prose-invert max-w-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedArticle.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TypeIcon type={selectedArticle.type} className="h-4 w-4" />
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span>Last updated: {selectedArticle.lastUpdated}</span>
                </div>
              </div>
            </div>
            
            {selectedArticle.type === 'video' ? (
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Video Player Placeholder</p>
              </div>
            ) : (
              <div className="mt-4">
                {selectedArticle.content}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2">
              {selectedArticle.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {selectedCategory === "All" && searchQuery === "" ? (
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a category to view articles</p>
              </div>
            ) : (
              <div className="text-center">
                <p>Select an article to view its content</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 