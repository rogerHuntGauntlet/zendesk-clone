"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import AdminAnalytics from '../components/ui/analytics/AdminAnalytics';
import BizDevContacts from '../components/ui/bizdev/BizDevContacts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'projects' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'
              )}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'analytics' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'
              )}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('team-management')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'team-management' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'
              )}
            >
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('bizdev')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'bizdev' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'
              )}
            >
              BizDev
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'projects' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project cards will go here */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900">Projects Overview</h3>
                  <p className="text-gray-500 mt-2">Select a project to view details</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AdminAnalytics />
          )}

          {activeTab === 'team-management' && (
            <div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
                <p className="text-gray-500 mt-2">Manage your teams and members</p>
              </div>
            </div>
          )}

          {activeTab === 'bizdev' && (
            <div className="space-y-6">
              <BizDevContacts />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 