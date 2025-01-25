"use client";

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import NewTeamModal from './NewTeamModal';
import TeamDetailModal from './TeamDetailModal';
import toast from 'react-hot-toast';
import { Team } from './types';

export default function TeamManagement() {
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const handleCreateTeam = async (teamData: {
    name: string;
    description: string;
    focusArea: string;
    teamLeadId: string;
  }) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      const newTeam = await response.json();
      // Transform the API response to match our Team interface
      const transformedTeam: Team = {
        id: newTeam.id,
        name: newTeam.name,
        description: newTeam.description || '',
        focusArea: newTeam.focus_area,
        teamLead: {
          id: newTeam.team_lead.id,
          name: newTeam.team_lead.name,
          email: newTeam.team_lead.email,
        },
        memberCount: newTeam.team_members?.length || 1, // At least 1 for the team lead
      };
      
      setTeams(prev => [...prev, transformedTeam]);
      setIsNewTeamModalOpen(false);
      toast.success('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-white/60 mt-1">Create and manage your support teams</p>
        </div>
        <button
          onClick={() => setIsNewTeamModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Team
        </button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                <p className="text-white/60 mt-1">{team.description || 'No description'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Focus Area</span>
                <span className="text-white">{team.focusArea}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Team Lead</span>
                <span className="text-white">
                  {team.teamLead?.name || 'Not assigned'}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Team Size</span>
                <span className="text-white">{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedTeam(team)}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium"
              >
                Manage Team →
              </button>
            </div>
          </div>
        ))}

        {/* Add Team Card */}
        <button
          onClick={() => setIsNewTeamModalOpen(true)}
          className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-dashed border-white/20 hover:border-white/40 transition-all"
        >
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="rounded-full bg-violet-500/10 p-3">
              <PlusIcon className="h-6 w-6 text-violet-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">Create New Team</h3>
              <p className="text-white/60 mt-1">Add a new support team</p>
            </div>
          </div>
        </button>
      </div>

      <NewTeamModal
        isOpen={isNewTeamModalOpen}
        onClose={() => setIsNewTeamModalOpen(false)}
        onSubmit={handleCreateTeam}
      />

      {selectedTeam && (
        <TeamDetailModal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          team={selectedTeam}
        />
      )}
    </div>
  );
} 