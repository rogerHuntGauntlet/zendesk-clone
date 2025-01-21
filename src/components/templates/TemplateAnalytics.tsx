import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { templateManager, type TemplateAnalytics } from "@/lib/api/templates";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface TemplateAnalyticsProps {
  templateId?: string; // If provided, shows analytics for a specific template
}

export function TemplateAnalytics({ templateId }: TemplateAnalyticsProps) {
  const [analytics, setAnalytics] = React.useState<TemplateAnalytics[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadAnalytics = async () => {
      try {
        if (templateId) {
          const data = await templateManager.getTemplateAnalytics(templateId);
          setAnalytics(data ? [data] : []);
        } else {
          const data = await templateManager.getAllTemplateAnalytics();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to load template analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();

    // Subscribe to template usage updates
    const unsubscribe = templateManager.onTemplateUsed(({ templateId: id, analytics: newAnalytics }) => {
      setAnalytics(prev => {
        if (templateId && templateId !== id) return prev;
        const index = prev.findIndex(a => a.templateId === id);
        if (index === -1) return [...prev, newAnalytics];
        const updated = [...prev];
        updated[index] = newAnalytics;
        return updated;
      });
    });

    return () => unsubscribe();
  }, [templateId]);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (analytics.length === 0) {
    return <div>No analytics data available.</div>;
  }

  const chartData = analytics.map(a => ({
    name: a.templateId,
    usageCount: a.usageCount,
    successRate: Math.round(a.successRate * 100),
    responseTime: Math.round(a.averageResponseTime),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Usage</CardTitle>
            <CardDescription>Number of times templates were used</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.reduce((sum, a) => sum + a.usageCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Success Rate</CardTitle>
            <CardDescription>Percentage of successful responses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(
                analytics.reduce((sum, a) => sum + a.successRate, 0) / analytics.length * 100
              )}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Response Time</CardTitle>
            <CardDescription>Time to resolve tickets using templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(
                analytics.reduce((sum, a) => sum + a.averageResponseTime, 0) / analytics.length
              )}s
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Performance</CardTitle>
          <CardDescription>Usage and success metrics by template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usageCount" name="Usage Count" fill="#4f46e5" />
                <Bar dataKey="successRate" name="Success Rate %" fill="#22c55e" />
                <Bar dataKey="responseTime" name="Avg Response Time (s)" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 