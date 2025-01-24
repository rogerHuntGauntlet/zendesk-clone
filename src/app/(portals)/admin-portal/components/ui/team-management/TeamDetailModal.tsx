"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserPlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { Team } from './types';

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
}

export default function TeamDetailModal({ isOpen, onClose, team }: TeamDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'skills'>('members');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleAddMember = async (memberId: string, role: string) => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to add team member');
      }

      // Refresh team data
      setIsAddingMember(false);
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleRemoveMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members/bulk-remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberIds: selectedMembers }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove team members');
      }

      setSelectedMembers([]);
    } catch (error) {
      console.error('Error removing team members:', error);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="relative transform rounded-lg bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-full max-w-4xl sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div>
                <div className="mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                    {team.name}
                  </Dialog.Title>
                  <p className="mt-1 text-white/60">{team.description}</p>
                </div>

                <div className="border-b border-white/10 mb-6">
                  <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'members'
                          ? 'border-violet-500 text-violet-500'
                          : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Team Members
                    </button>
                    <button
                      onClick={() => setActiveTab('roles')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'roles'
                          ? 'border-violet-500 text-violet-500'
                          : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Roles & Permissions
                    </button>
                    <button
                      onClick={() => setActiveTab('skills')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'skills'
                          ? 'border-violet-500 text-violet-500'
                          : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Skills
                    </button>
                  </nav>
                </div>

                {activeTab === 'members' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        {selectedMembers.length > 0 && (
                          <button
                            onClick={handleRemoveMembers}
                            className="inline-flex items-center px-3 py-1.5 border border-red-500/20 rounded-md text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20"
                          >
                            Remove Selected
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setIsAddingMember(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-violet-500/20 rounded-md text-sm font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20"
                      >
                        <UserPlusIcon className="h-4 w-4 mr-1.5" />
                        Add Member
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-white/10">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            <th scope="col" className="relative px-4 py-3.5">
                              <input
                                type="checkbox"
                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500"
                                checked={selectedMembers.length > 0}
                                onChange={(e) => {
                                  // TODO: Implement select all
                                }}
                              />
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                              Name
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                              Role
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                              Skills
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {/* TODO: Map through team members */}
                          <tr>
                            <td className="relative px-4 py-4">
                              <input
                                type="checkbox"
                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500"
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                              John Smith
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                              Developer
                            </td>
                            <td className="px-3 py-4 text-sm text-white">
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                  <TagIcon className="h-3 w-3 mr-1" />
                                  React
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                  <TagIcon className="h-3 w-3 mr-1" />
                                  TypeScript
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'roles' && (
                  <div>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-white/10 p-4">
                        <h4 className="text-sm font-medium text-white mb-2">Available Roles</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">Team Lead</p>
                              <p className="text-xs text-white/60">Can manage team and assign roles</p>
                            </div>
                            <button className="text-violet-400 text-sm hover:text-violet-300">
                              Edit Permissions
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">Senior Developer</p>
                              <p className="text-xs text-white/60">Can review and assign tickets</p>
                            </div>
                            <button className="text-violet-400 text-sm hover:text-violet-300">
                              Edit Permissions
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">Developer</p>
                              <p className="text-xs text-white/60">Can work on assigned tickets</p>
                            </div>
                            <button className="text-violet-400 text-sm hover:text-violet-300">
                              Edit Permissions
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-white/10 p-4">
                        <h4 className="text-sm font-medium text-white mb-2">Skill Categories</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-white mb-2">Frontend Development</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                React
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                Vue
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                Angular
                              </span>
                              <button className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40">
                                + Add Skill
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-white mb-2">Backend Development</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                Node.js
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                Python
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400">
                                Java
                              </span>
                              <button className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40">
                                + Add Skill
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 