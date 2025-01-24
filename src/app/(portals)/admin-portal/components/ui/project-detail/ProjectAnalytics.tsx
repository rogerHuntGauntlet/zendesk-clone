"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

interface ProjectAnalyticsProps {
  projectId: string;
}

interface TeamMetrics {
  avgResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  ticketsByStatus: {
    new: number;
    in_progress: number;
    resolved: number;
  };
  ticketTrend: {
    date: string;
    count: number;
  }[];
  agentPerformance: {
    name: string;
    ticketsResolved: number;
    avgResponseTime: number;
    satisfaction: number;
  }[];
}

interface AgentData {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  user: {
    name: string;
    id: string;
  };
}

export default function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [metrics, setMetrics] = useState<TeamMetrics>({
    avgResponseTime: 0,
    resolutionRate: 0,
    customerSatisfaction: 0,
    ticketsByStatus: {
      new: 0,
      in_progress: 0,
      resolved: 0
    },
    ticketTrend: [],
    agentPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchMetrics();
  }, [projectId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch ticket metrics
      const { data: ticketData, error: ticketError } = await supabase
        .from('zen_tickets')
        .select('status, created_at, resolved_at, assigned_to')
        .eq('project_id', projectId);

      if (ticketError) throw ticketError;

      // Calculate metrics
      const now = new Date();
      const totalTickets = ticketData.length;
      const resolvedTickets = ticketData.filter(t => t.status === 'resolved').length;
      const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

      // Calculate average response time (in hours)
      const avgResponseTime = ticketData.reduce((acc, ticket) => {
        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at);
          const resolved = new Date(ticket.resolved_at);
          return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0) / resolvedTickets || 0;

      // Group tickets by status
      const ticketsByStatus = {
        new: ticketData.filter(t => t.status === 'new').length,
        in_progress: ticketData.filter(t => t.status === 'in_progress').length,
        resolved: resolvedTickets
      };

      // Calculate ticket trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return format(date, 'yyyy-MM-dd');
      }).reverse();

      const ticketTrend = last7Days.map(date => ({
        date,
        count: ticketData.filter(t => 
          format(new Date(t.created_at), 'yyyy-MM-dd') === date
        ).length
      }));

      // Fetch agent performance
      const { data: agentData, error: agentError } = await supabase
        .from('zen_project_members')
        .select(`
          *,
          user:zen_users!zen_project_members_user_id_fkey(
            name,
            id
          )
        `)
        .eq('project_id', projectId)
        .neq('role', 'client');

      if (agentError) throw agentError;

      // Calculate agent performance metrics
      const agentPerformance = await Promise.all(
        (agentData as unknown as AgentData[]).map(async (agent) => {
          const { data: agentTickets } = await supabase
            .from('zen_tickets')
            .select('*')
            .eq('project_id', projectId)
            .eq('assigned_to', agent.user.id);

          const resolvedTickets = agentTickets?.filter(t => t.status === 'resolved') || [];
          const avgResponse = resolvedTickets.reduce((acc, ticket) => {
            if (ticket.resolved_at) {
              const created = new Date(ticket.created_at);
              const resolved = new Date(ticket.resolved_at);
              return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
            }
            return acc;
          }, 0) / resolvedTickets.length || 0;

          return {
            name: agent.user.name,
            ticketsResolved: resolvedTickets.length,
            avgResponseTime: avgResponse,
            satisfaction: Math.random() * 20 + 80 // Placeholder for actual satisfaction data
          };
        })
      );

      setMetrics({
        avgResponseTime,
        resolutionRate,
        customerSatisfaction: 92, // Placeholder - would come from actual feedback data
        ticketsByStatus,
        ticketTrend,
        agentPerformance
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
          ))}
        </div>
        <div className="h-80 bg-white/5 rounded-lg"></div>
        <div className="h-80 bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Resolution Rate</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.resolutionRate.toFixed(1)}%</span>
            <span className="text-white/60 mb-1">of tickets resolved</span>
          </div>
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${metrics.resolutionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Average Response Time</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.avgResponseTime.toFixed(1)}h</span>
            <span className="text-white/60 mb-1">per ticket</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {Object.entries(metrics.ticketsByStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-sm font-medium text-white">{count}</div>
                <div className="text-xs text-white/60 capitalize">{status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Customer Satisfaction</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.customerSatisfaction}%</span>
            <span className="text-white/60 mb-1">satisfaction rate</span>
          </div>
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${metrics.customerSatisfaction}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ticket Trend Chart */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Ticket Volume Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.ticketTrend}>
              <XAxis 
                dataKey="date" 
                stroke="#ffffff60"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
              />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(23, 23, 23, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Team Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.agentPerformance}>
              <XAxis 
                dataKey="name" 
                stroke="#ffffff60"
              />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(23, 23, 23, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar 
                dataKey="ticketsResolved" 
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 