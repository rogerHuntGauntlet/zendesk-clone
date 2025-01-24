"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

interface GlobalMetrics {
  totalProjects: number;
  totalTickets: number;
  totalTeamMembers: number;
  totalClients: number;
  avgResolutionTime: number;
  overallSatisfaction: number;
  projectStatuses: {
    active: number;
    completed: number;
    on_hold: number;
  };
  ticketTrend: {
    date: string;
    count: number;
  }[];
  projectPerformance: {
    name: string;
    ticketsResolved: number;
    activeTickets: number;
    teamSize: number;
  }[];
  ticketDistribution: {
    status: string;
    count: number;
  }[];
}

interface ProjectMember {
  user_id: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  zen_project_members: ProjectMember[];
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    totalProjects: 0,
    totalTickets: 0,
    totalTeamMembers: 0,
    totalClients: 0,
    avgResolutionTime: 0,
    overallSatisfaction: 0,
    projectStatuses: {
      active: 0,
      completed: 0,
      on_hold: 0
    },
    ticketTrend: [],
    projectPerformance: [],
    ticketDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchGlobalMetrics();
  }, []);

  const fetchGlobalMetrics = async () => {
    try {
      setLoading(true);

      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from('zen_projects')
        .select('*, zen_project_members(*)');

      if (projectsError) throw projectsError;

      // Fetch all tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('zen_tickets')
        .select('*');

      if (ticketsError) throw ticketsError;

      // Calculate project statuses
      const projectStatuses = {
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        on_hold: projects.filter(p => p.status === 'on-hold').length
      };

      // Calculate ticket trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return format(date, 'yyyy-MM-dd');
      }).reverse();

      const ticketTrend = last7Days.map(date => ({
        date,
        count: tickets.filter(t => 
          format(new Date(t.created_at), 'yyyy-MM-dd') === date
        ).length
      }));

      // Calculate project performance
      const projectPerformance = projects.map(project => {
        const projectTickets = tickets.filter(t => t.project_id === project.id);
        return {
          name: project.name,
          ticketsResolved: projectTickets.filter(t => t.status === 'resolved').length,
          activeTickets: projectTickets.filter(t => t.status !== 'resolved').length,
          teamSize: project.zen_project_members.filter((m: ProjectMember) => m.role !== 'client').length
        };
      });

      // Calculate ticket distribution
      const ticketDistribution = [
        { status: 'New', count: tickets.filter(t => t.status === 'new').length },
        { status: 'In Progress', count: tickets.filter(t => t.status === 'in_progress').length },
        { status: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length }
      ];

      // Calculate average resolution time
      const resolvedTickets = tickets.filter(t => t.status === 'resolved' && t.resolved_at);
      const avgResolutionTime = resolvedTickets.reduce((acc, ticket) => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.resolved_at);
        return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
      }, 0) / resolvedTickets.length || 0;

      setMetrics({
        totalProjects: projects.length,
        totalTickets: tickets.length,
        totalTeamMembers: new Set(projects.flatMap(p => 
          p.zen_project_members.filter((m: ProjectMember) => m.role !== 'client').map((m: ProjectMember) => m.user_id)
        )).size,
        totalClients: new Set(projects.flatMap(p => 
          p.zen_project_members.filter((m: ProjectMember) => m.role === 'client').map((m: ProjectMember) => m.user_id)
        )).size,
        avgResolutionTime,
        overallSatisfaction: 92, // Placeholder
        projectStatuses,
        ticketTrend,
        projectPerformance,
        ticketDistribution
      });

    } catch (error) {
      console.error('Error fetching global metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-80 bg-white/5 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Projects</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.totalProjects}</span>
            <span className="text-white/60 mb-1">total</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm font-medium text-white">{metrics.projectStatuses.active}</div>
              <div className="text-xs text-white/60">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white">{metrics.projectStatuses.completed}</div>
              <div className="text-xs text-white/60">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white">{metrics.projectStatuses.on_hold}</div>
              <div className="text-xs text-white/60">On Hold</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Team Size</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.totalTeamMembers}</span>
            <span className="text-white/60 mb-1">members</span>
          </div>
          <div className="mt-4">
            <div className="text-sm text-white/60">
              {metrics.totalClients} Active Clients
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Resolution Time</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.avgResolutionTime.toFixed(1)}h</span>
            <span className="text-white/60 mb-1">average</span>
          </div>
          <div className="mt-4">
            <div className="text-sm text-white/60">
              {metrics.totalTickets} Total Tickets
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Satisfaction</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{metrics.overallSatisfaction}%</span>
            <span className="text-white/60 mb-1">satisfied</span>
          </div>
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${metrics.overallSatisfaction}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket Trend */}
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

        {/* Ticket Distribution */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Ticket Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.ticketDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {metrics.ticketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Performance */}
        <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Project Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.projectPerformance}>
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
                  name="Resolved Tickets"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="activeTickets" 
                  name="Active Tickets"
                  fill="#ec4899"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 