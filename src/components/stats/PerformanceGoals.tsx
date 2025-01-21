import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { statsManager, type PerformanceGoal } from "@/lib/api/stats";
import { Target, Plus, Trash2, Calendar, TrendingUp, Clock, ThumbsUp } from "lucide-react";

interface PerformanceGoalsProps {
  goals: Array<{
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
  }>;
}

export function PerformanceGoals({ goals }: PerformanceGoalsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Goals</h2>
          <p className="text-muted-foreground">
            Track your progress towards your performance targets
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {goal.metric}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goal.progress}{goal.unit}
                <span className={`ml-2 text-sm font-normal ${
                  goal.trend.direction === 'up' 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {goal.trend.direction === 'up' ? '↑' : '↓'}{goal.trend.value}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: {goal.target}{goal.unit}
              </p>
              <Progress 
                value={(goal.progress / goal.target) * 100} 
                className="mt-3"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
          <CardDescription>Your progress across all performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {goal.metric}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {goal.progress} of {goal.target}{goal.unit}
                  </p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <div className={`text-sm ${
                    (goal.progress / goal.target) >= 1
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {Math.round((goal.progress / goal.target) * 100)}%
                  </div>
                  <Progress
                    value={(goal.progress / goal.target) * 100}
                    className="w-[60px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface GoalFormProps {
  userId: string;
  onComplete: () => void;
}

function GoalForm({ userId, onComplete }: GoalFormProps) {
  const [formData, setFormData] = React.useState({
    metric: 'tickets' as const,
    target: '',
    timeframe: 'daily' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await statsManager.createGoal(userId, {
        ...formData,
        userId,
        target: Number(formData.target),
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        progress: 0,
      });
      onComplete();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metric">Metric</Label>
        <Select
          value={formData.metric}
          onValueChange={(value: any) => setFormData({ ...formData, metric: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tickets">Tickets Resolved</SelectItem>
            <SelectItem value="responseTime">Response Time</SelectItem>
            <SelectItem value="satisfaction">Customer Satisfaction</SelectItem>
            <SelectItem value="responseRate">Response Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target">Target Value</Label>
        <Input
          id="target"
          type="number"
          value={formData.target}
          onChange={(e) => setFormData({ ...formData, target: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeframe">Timeframe</Label>
        <Select
          value={formData.timeframe}
          onValueChange={(value: any) => setFormData({ ...formData, timeframe: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">Create Goal</Button>
    </form>
  );
} 