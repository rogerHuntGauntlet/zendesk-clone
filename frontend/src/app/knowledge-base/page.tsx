"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArticleList } from "@/components/knowledge-base/ArticleList";
import { ArticleViewer } from "@/components/knowledge-base/ArticleViewer";

export default function KnowledgeBasePage() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Knowledge Base</h1>
        
        {selectedArticleId ? (
          <ArticleViewer
            articleId={selectedArticleId}
            onBack={() => setSelectedArticleId(null)}
          />
        ) : (
          <ArticleList
            onArticleSelect={setSelectedArticleId}
            showAuthor={true}
            showMetrics={true}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 