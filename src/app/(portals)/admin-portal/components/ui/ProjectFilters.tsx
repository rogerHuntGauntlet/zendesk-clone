import React from 'react';

interface ProjectFiltersProps {
  onSearch: (query: string) => void;
  onFilterStatus: (status: string) => void;
  onSort: (field: string) => void;
}

export default function ProjectFilters({ onSearch, onFilterStatus, onSort }: ProjectFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-6">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-violet-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <select
        onChange={(e) => onFilterStatus(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="on-hold">On Hold</option>
      </select>

      <select
        onChange={(e) => onSort(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name">Name A-Z</option>
        <option value="tickets">Most Tickets</option>
      </select>
    </div>
  );
} 