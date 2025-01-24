import React from 'react';
import { Project, ProjectStats } from '../../types/project';

interface ProjectMetricsProps {
  stats: ProjectStats;
  projects: Project[];
}

export default function ProjectMetrics({ stats, projects }: ProjectMetricsProps) {
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Projects Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Total Projects</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalProjects}</h3>
          </div>
          <div className="bg-violet-500/20 p-3 rounded-full">
            <svg className="w-6 h-6 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-violet-500 rounded-full h-2"
              style={{ width: `${calculatePercentage(stats.activeProjects, stats.totalProjects)}%` }}
            />
          </div>
          <p className="text-sm text-white/60 mt-2">
            {stats.activeProjects} Active ({calculatePercentage(stats.activeProjects, stats.totalProjects)}%)
          </p>
        </div>
      </div>

      {/* Active Tickets Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Active Tickets</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.activeTickets}</h3>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-full">
            <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-blue-500 rounded-full h-2"
              style={{ width: `${calculatePercentage(stats.activeTickets, stats.totalTickets)}%` }}
            />
          </div>
          <p className="text-sm text-white/60 mt-2">
            {calculatePercentage(stats.activeTickets, stats.totalTickets)}% of total tickets
          </p>
        </div>
      </div>

      {/* Team Members Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Team Members</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalEmployees}</h3>
          </div>
          <div className="bg-green-500/20 p-3 rounded-full">
            <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-white/60">
            <span>Employees: {stats.totalEmployees}</span>
            <span>Clients: {stats.totalClients}</span>
          </div>
        </div>
      </div>

      {/* Project Health Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Project Health</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {calculatePercentage(stats.activeProjects, stats.totalProjects)}%
            </h3>
          </div>
          <div className="bg-yellow-500/20 p-3 rounded-full">
            <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/60">
              <span>Active</span>
              <span>{stats.activeProjects}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Completed</span>
              <span>
                {projects.filter(p => p.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>On Hold</span>
              <span>
                {projects.filter(p => p.status === 'on-hold').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 