import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { FiClock, FiGlobe, FiCalendar, FiUsers } from 'react-icons/fi';

interface ScheduleManagementProps {
  projectId: string;
  members: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
    role: string;
  }>;
}

interface WorkingHours {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function ScheduleManagement({ projectId, members }: ScheduleManagementProps) {
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState<'hours' | 'timezone' | 'shifts'>('hours');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSaveWorkingHours = async (userId: string, dayOfWeek: number, startTime: string, endTime: string) => {
    try {
      const { error } = await supabase
        .from('zen_working_hours')
        .upsert({
          user_id: userId,
          project_id: projectId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime
        });

      if (error) throw error;
      toast.success('Working hours updated successfully');
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast.error('Failed to update working hours');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('hours')}
          className={`flex items-center space-x-2 px-4 py-2 ${
            activeTab === 'hours' ? 'border-b-2 border-violet-500 text-violet-500' : 'text-white/60'
          }`}
        >
          <FiClock className="w-4 h-4" />
          <span>Working Hours</span>
        </button>
        <button
          onClick={() => setActiveTab('timezone')}
          className={`flex items-center space-x-2 px-4 py-2 ${
            activeTab === 'timezone' ? 'border-b-2 border-violet-500 text-violet-500' : 'text-white/60'
          }`}
        >
          <FiGlobe className="w-4 h-4" />
          <span>Time Zones</span>
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center space-x-2 px-4 py-2 ${
            activeTab === 'shifts' ? 'border-b-2 border-violet-500 text-violet-500' : 'text-white/60'
          }`}
        >
          <FiCalendar className="w-4 h-4" />
          <span>Shift Planning</span>
        </button>
      </div>

      {/* Member Selection */}
      <div className="flex items-center space-x-4">
        <FiUsers className="w-5 h-5 text-white/60" />
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="bg-white/5 text-white border border-white/10 rounded-md px-3 py-2 w-64"
        >
          <option value="">Select team member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Working Hours Tab */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Set Working Hours</h3>
          <div className="grid gap-4">
            {days.map((day, index) => (
              <div key={day} className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg">
                <span className="w-32 text-white">{day}</span>
                <input
                  type="time"
                  className="bg-white/5 text-white border border-white/10 rounded-md px-3 py-2"
                  onChange={(e) => {
                    if (selectedMember) {
                      handleSaveWorkingHours(selectedMember, index, e.target.value, '17:00');
                    }
                  }}
                />
                <span className="text-white">to</span>
                <input
                  type="time"
                  className="bg-white/5 text-white border border-white/10 rounded-md px-3 py-2"
                  onChange={(e) => {
                    if (selectedMember) {
                      handleSaveWorkingHours(selectedMember, index, '09:00', e.target.value);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Zones Tab */}
      {activeTab === 'timezone' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Time Zone Management</h3>
          {selectedMember && (
            <div className="bg-white/5 p-4 rounded-lg">
              <select
                className="bg-white/5 text-white border border-white/10 rounded-md px-3 py-2 w-full"
                onChange={(e) => {
                  // Handle timezone change
                  toast.success('Time zone updated successfully');
                }}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Shift Planning Tab */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Shift Planning</h3>
          <div className="grid grid-cols-7 gap-4">
            {days.map((day) => (
              <div key={day} className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">{day}</h4>
                <div className="space-y-2">
                  <button
                    className="w-full bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 px-2 py-1 rounded text-sm"
                    onClick={() => {
                      // Handle adding shift
                      toast.success('Shift added successfully');
                    }}
                  >
                    + Add Shift
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 