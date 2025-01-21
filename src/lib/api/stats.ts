export interface PerformanceGoal {
  id: string;
  metric: string;
  target: number;
  progress: number;
  unit: string;
  trend: {
    value: number;
    direction: 'up' | 'down';
  };
  timeframe: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
}

class StatsManager {
  private goals: PerformanceGoal[] = [];

  constructor() {
    // Initialize with mock data for development
    this.goals = [
      {
        id: 'goal-1',
        metric: 'Tickets Resolved',
        target: 50,
        progress: 45,
        unit: '',
        trend: {
          value: 15,
          direction: 'up'
        },
        timeframe: 'weekly',
        startDate: '2024-01-15',
        endDate: '2024-01-21'
      },
      {
        id: 'goal-2',
        metric: 'Response Time',
        target: 60,
        progress: 45,
        unit: 'min',
        trend: {
          value: 10,
          direction: 'down'
        },
        timeframe: 'daily',
        startDate: '2024-01-21'
      },
      {
        id: 'goal-3',
        metric: 'Customer Satisfaction',
        target: 4.8,
        progress: 4.5,
        unit: '',
        trend: {
          value: 5,
          direction: 'up'
        },
        timeframe: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
    ];
  }

  async getGoals(): Promise<PerformanceGoal[]> {
    return this.goals;
  }

  async addGoal(goal: Omit<PerformanceGoal, 'id'>): Promise<PerformanceGoal> {
    const newGoal = {
      ...goal,
      id: `goal-${this.goals.length + 1}`
    };
    this.goals.push(newGoal);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<PerformanceGoal>): Promise<PerformanceGoal | null> {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    this.goals[index] = {
      ...this.goals[index],
      ...updates
    };
    return this.goals[index];
  }

  async deleteGoal(id: string): Promise<boolean> {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) return false;
    
    this.goals.splice(index, 1);
    return true;
  }

  async updateProgress(id: string, progress: number): Promise<PerformanceGoal | null> {
    return this.updateGoal(id, { progress });
  }
}

export const statsManager = new StatsManager(); 