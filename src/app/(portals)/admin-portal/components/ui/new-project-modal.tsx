import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, ChevronRight, ChevronLeft, Users, Briefcase, HeadphonesIcon, PlayCircle, PlusCircle, UserMinus } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface TeamMemberInvite {
  email: string;
  role: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  name: string | null;
  avatar_url: string | null;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    name: string;
    description: string;
    projectType: string;
  }) => Promise<{ id: string }>;
}

const projectTypes = [
  {
    id: 'business-development',
    name: 'Business Development',
    description: 'Ideal for tracking prospects by creating tickets for each one. Collaborate with your team to update and engage with prospects at every interaction.',
    icon: Briefcase,
    color: 'from-blue-500 to-cyan-500',
    videoPrompt: `Create a tutorial video showing how to:
      1. Create a new business development ticket
      2. Track prospect interactions
      3. Collaborate with team members
      4. Move prospects through sales stages`
  },
  {
    id: 'team-project',
    name: 'Team Project',
    description: 'Perfect for sharing updates and progress on specific initiatives, ensuring everyone is aligned and informed.',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    videoPrompt: `Create a tutorial video showing how to:
      1. Set up a new team project
      2. Add and manage team members
      3. Create and track project milestones
      4. Share updates and collaborate`
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    description: 'Provides clients with direct access to support in an organized and efficient manner.',
    icon: HeadphonesIcon,
    color: 'from-green-500 to-emerald-500',
    videoPrompt: `Create a tutorial video showing how to:
      1. Handle incoming customer support tickets
      2. Assign and escalate tickets
      3. Use response templates
      4. Track customer satisfaction`
  }
];

export default function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInvite[]>([]);
  const [previouslyInvited, setPreviouslyInvited] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('employee');
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);

  useEffect(() => {
    if (currentStep === 3) {
      fetchPreviousUsers();
    }
  }, [currentStep]);

  const fetchPreviousUsers = async () => {
    setFetchingUsers(true);
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch distinct emails and roles from pending invites where the current user was the inviter
      const { data: invites, error: invitesError } = await supabase
        .from('zen_pending_invites')
        .select('email, role')
        .eq('invited_by', user.id)
        .order('invited_at', { ascending: false });

      if (invitesError) throw invitesError;

      // Get unique invites (latest role per email)
      const uniqueInvites = invites?.reduce((acc: { [key: string]: any }, invite) => {
        if (!acc[invite.email]) {
          acc[invite.email] = invite;
        }
        return acc;
      }, {});

      const formattedMembers = Object.values(uniqueInvites || {}).map((invite: any) => ({
        id: invite.email, // Using email as ID since we don't have user IDs for invites
        email: invite.email,
        role: invite.role,
        name: null,
        avatar_url: null
      }));

      setPreviouslyInvited(formattedMembers);
    } catch (err) {
      console.error('Error fetching previous users:', err);
      setError('Failed to load team members');
    } finally {
      setFetchingUsers(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleAddMember = (email: string, role: string) => {
    if (!teamMembers.some(member => member.email === email)) {
      setTeamMembers([...teamMembers, { email, role }]);
    }
  };

  const handleRemoveMember = (email: string) => {
    setTeamMembers(teamMembers.filter((member) => member.email !== email));
  };

  const handleVideoOpen = (url: string) => {
    setVideoUrl(url);
    setVideoModalOpen(true);
  };

  const handleVideoClose = () => {
    setVideoUrl(null);
    setVideoModalOpen(false);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, create the project
      const result = await onSubmit({ 
        ...formData, 
        projectType: selectedProjectType!
      });

      if (!result?.id) {
        throw new Error('Failed to create project: No project ID returned');
      }

      const projectId = result.id;

      // Get the current user's ID for the invited_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create pending invites for all team members
      for (const member of teamMembers) {
        const { data: invite, error: inviteError } = await supabase
          .from('zen_pending_invites')
          .insert({
            project_id: projectId,
            email: member.email,
            role: member.role,
            status: 'pending',
            invited_by: user.id
          })
          .select()
          .single();

        if (inviteError) throw inviteError;

        // Send invite email
        try {
          await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: member.email,
              projectName: formData.name,
              inviteType: member.role,
              inviteToken: invite.id
            }),
          });
        } catch (emailError) {
          console.error('Error sending invite email:', emailError);
          // Continue with other invites even if email fails
        }
      }

      // Reset form state
      setFormData({ name: '', description: '' });
      setSelectedProjectType(null);
      setTeamMembers([]);
      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async (projectType: string) => {
    // Never gonna give you up...
    setVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
    setVideoModalOpen(true);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white shadow-2xl">
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentStep / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-6 pt-8">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                {currentStep === 1 && "Choose Project Type"}
                {currentStep === 2 && "Project Details"}
                {currentStep === 3 && "Invite Team Members"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-base text-gray-600">
                {currentStep === 1 && "Select the type of project that best fits your needs"}
                {currentStep === 2 && "Fill in the basic information about your project"}
                {currentStep === 3 && "Add team members to collaborate on this project"}
              </Dialog.Description>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <X className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleFinalSubmit} className="mt-6 space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    {projectTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <motion.div
                          key={type.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedProjectType === type.name
                              ? 'border-violet-600 bg-violet-50'
                              : 'border-gray-200 hover:border-violet-300'
                          }`}
                          onClick={() => setSelectedProjectType(type.name)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${type.color}`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{type.name}</h3>
                                <p className="mt-1 text-sm text-gray-500">{type.description}</p>
                              </div>
                            </div>
                          </div>
                          {selectedProjectType === type.name && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 flex justify-between items-center border-t pt-4"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateVideo(type.name);
                                }}
                                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-2"
                              >
                                <PlayCircle className="w-4 h-4" />
                                Watch Tutorial
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Project Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        placeholder="Enter a memorable name for your project"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        placeholder="What are the main goals and objectives of this project?"
                        disabled={loading}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 h-[500px] flex flex-col"
                  >
                    {/* Team members content */}
                    {fetchingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                        {/* Invite New Member - Fixed at top */}
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex-none">
                          <h4 className="text-sm font-medium text-gray-900">Invite New Member</h4>
                          <div className="mt-3 space-y-3">
                            <input
                              type="email"
                              placeholder="Enter team member's email"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                              disabled={loading}
                            />
                            <select
                              value={newMemberRole}
                              onChange={(e) => setNewMemberRole(e.target.value)}
                              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                              disabled={loading}
                            >
                              <option value="employee">Employee</option>
                              <option value="client">Client</option>
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                if (newMemberEmail) {
                                  handleAddMember(newMemberEmail, newMemberRole);
                                  setNewMemberEmail('');
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading || !newMemberEmail}
                            >
                              <PlusCircle className="w-5 h-5" />
                              Add Team Member
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Lists Container */}
                        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-2">
                          {/* New Team Members */}
                          {teamMembers.length > 0 && (
                            <div className="bg-violet-50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900">New Team Members</h4>
                              <div className="mt-3 space-y-2">
                                {teamMembers.map((member) => (
                                  <div key={member.email} className="flex items-center justify-between p-3 bg-white rounded-lg border border-violet-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                        <span className="text-violet-600 text-sm font-medium">
                                          {member.email[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{member.email}</p>
                                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMember(member.email)}
                                      className="text-violet-600 hover:text-violet-700"
                                    >
                                      <UserMinus className="w-5 h-5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Previously Invited Members */}
                          {previouslyInvited.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900">Previously Invited Members</h4>
                              <div className="mt-3 space-y-2">
                                {previouslyInvited.map((member) => (
                                  <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                          {member.email[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{member.email}</p>
                                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAddMember(member.email, member.role)}
                                      disabled={teamMembers.some(m => m.email === member.email)}
                                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        teamMembers.some(m => m.email === member.email)
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                      }`}
                                    >
                                      {teamMembers.some(m => m.email === member.email) ? 'Added' : 'Add'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Footer with navigation buttons */}
                <div className="flex justify-between pt-4 border-t">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  {currentStep < 3 && (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={currentStep === 2 && (!formData.name || !formData.description)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {currentStep === 3 && (
                    <button
                      type="submit"
                      disabled={loading || teamMembers.length === 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Video Modal */}
      <Dialog
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-[90vw] max-w-[1200px] rounded-lg bg-white p-6">
            <div className="aspect-video w-full">
              <iframe
                src={videoUrl}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  );
}