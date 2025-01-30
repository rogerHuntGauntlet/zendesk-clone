import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProspectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  onUpdate: () => void;
}

interface ProspectData {
  name: string;
  company: string;
  role: string;
  email: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
}

export default function ProspectInfoModal({ isOpen, onClose, ticket, onUpdate }: ProspectInfoModalProps) {
  const [prospectData, setProspectData] = useState<ProspectData>(() => ({
    name: ticket?.metadata?.prospect_data?.name || '',
    company: ticket?.metadata?.prospect_data?.company || '',
    role: ticket?.metadata?.prospect_data?.role || '',
    email: ticket?.metadata?.prospect_data?.email || '',
    phone: ticket?.metadata?.prospect_data?.phone || '',
    linkedin: ticket?.metadata?.prospect_data?.linkedin || '',
    notes: ticket?.metadata?.prospect_data?.notes || '',
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const supabase = createClientComponentClient();

  const handleSave = async () => {
    if (!ticket?.id) return;

    setIsSaving(true);
    setError('');

    try {
      // Update the ticket's metadata with the new prospect data
      const { error: updateError } = await supabase
        .from('zen_tickets')
        .update({
          metadata: {
            ...ticket.metadata,
            prospect_data: prospectData,
          },
        })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating prospect data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prospect data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-gray-900 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                  Edit Prospect Information
                </Dialog.Title>
                <button onClick={onClose} className="text-white/60 hover:text-white">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={prospectData.name}
                    onChange={(e) => setProspectData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={prospectData.company}
                    onChange={(e) => setProspectData(prev => ({ ...prev, company: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={prospectData.role}
                    onChange={(e) => setProspectData(prev => ({ ...prev, role: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={prospectData.email}
                    onChange={(e) => setProspectData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={prospectData.phone}
                    onChange={(e) => setProspectData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={prospectData.linkedin}
                    onChange={(e) => setProspectData(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={prospectData.notes}
                    onChange={(e) => setProspectData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 