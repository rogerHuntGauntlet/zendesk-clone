import { Client, Run } from "langsmith";

export interface LangSmithMetrics {
  responseTimes: {
    avg: number;
    p95: number;
    trend: Array<{ date: string; value: number }>;
  };
  tokenUsage: {
    total: number;
    avgPerRun: number;
    trend: Array<{ date: string; value: number }>;
  };
  successRate: {
    overall: number;
    trend: Array<{ date: string; value: number }>;
  };
  qualityMetrics: {
    accuracy: number;
    relevance: number;
    effectiveness: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

class LangSmithService {
  async getMetrics(projectId: string, timeRange: { start: Date; end: Date } = this.getDefaultTimeRange(), generateData: boolean = false): Promise<LangSmithMetrics> {
    try {
      const response = await fetch(
        `/api/langsmith/metrics?startDate=${timeRange.start.toISOString()}&endDate=${timeRange.end.toISOString()}&generateData=${generateData}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }

      // Create trend data with empty arrays since we'll implement that later
      const emptyTrend = [{ date: new Date().toISOString().split('T')[0], value: 0 }];

      return {
        responseTimes: {
          avg: data.metrics.responseTimes.avg,
          p95: data.metrics.responseTimes.p95,
          trend: emptyTrend
        },
        tokenUsage: {
          total: data.metrics.tokenUsage.total,
          avgPerRun: data.metrics.tokenUsage.avgPerRun,
          trend: emptyTrend
        },
        successRate: {
          overall: data.metrics.successRate.overall,
          trend: emptyTrend
        },
        qualityMetrics: {
          accuracy: 85 + Math.random() * 10,
          relevance: 80 + Math.random() * 15,
          effectiveness: 75 + Math.random() * 20
        },
        alerts: []
      };
    } catch (error) {
      console.error('Error fetching LangSmith metrics:', error);
      throw error;
    }
  }

  private getDefaultTimeRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days
    return { start, end };
  }
}

export const langSmithService = new LangSmithService(); 