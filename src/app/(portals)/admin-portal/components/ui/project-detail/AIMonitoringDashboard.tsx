'use client';

import { useEffect, useState } from 'react';
import { langSmithService } from '@/app/services/langsmith';
import { LangSmithMetrics } from '@/app/services/langsmith';
import { Button } from '@/components/ui/button';

export default function AIMonitoringDashboard({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState<LangSmithMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (generateData: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await langSmithService.getMetrics(projectId, undefined, generateData);
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [projectId]);

  if (loading) {
    return <div>Loading metrics...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => fetchMetrics(true)}>
          Generate Test Data
        </Button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4">
        <p className="mb-4">No metrics data available.</p>
        <Button onClick={() => fetchMetrics(true)}>
          Generate Test Data
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Monitoring Dashboard</h2>
        <Button onClick={() => fetchMetrics(true)}>
          Generate More Test Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Response Times */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Response Times</h3>
          <p>Average: {Math.round(metrics.responseTimes.avg)}ms</p>
          <p>95th Percentile: {Math.round(metrics.responseTimes.p95)}ms</p>
        </div>

        {/* Token Usage */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Token Usage</h3>
          <p>Total: {metrics.tokenUsage.total}</p>
          <p>Average per Run: {Math.round(metrics.tokenUsage.avgPerRun)}</p>
        </div>

        {/* Success Rate */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
          <p>{Math.round(metrics.successRate.overall)}%</p>
        </div>

        {/* Quality Metrics */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Quality Metrics</h3>
          <p>Accuracy: {Math.round(metrics.qualityMetrics.accuracy)}%</p>
          <p>Relevance: {Math.round(metrics.qualityMetrics.relevance)}%</p>
          <p>Effectiveness: {Math.round(metrics.qualityMetrics.effectiveness)}%</p>
        </div>

        {/* Alerts */}
        <div className="p-4 border rounded-lg col-span-full">
          <h3 className="text-lg font-semibold mb-2">Recent Alerts</h3>
          {metrics.alerts.length === 0 ? (
            <p>No active alerts</p>
          ) : (
            <ul>
              {metrics.alerts.map(alert => (
                <li key={alert.id} className={`text-${alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}-500`}>
                  {alert.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 