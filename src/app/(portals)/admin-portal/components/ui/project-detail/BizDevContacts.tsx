import { useState } from 'react';
import { FiUpload, FiUserPlus } from 'react-icons/fi';
import { toast } from 'sonner';
import { useSupabase } from '@/lib/supabase/client';
import { AgentFactory } from '@/lib/agents/AgentFactory';

interface Contact {
  name: string;
  email: string;
  company: string;
  notes?: string;
}

export default function BizDevContacts() {
  const { supabase } = useSupabase();
  const [isUploading, setIsUploading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
    name: '',
    email: '',
    company: '',
    notes: ''
  });

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const contacts: Contact[] = [];

        // Skip header row and process each line
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split(',');
          if (row.length >= 3) {
            contacts.push({
              name: row[0].trim(),
              email: row[1].trim(),
              company: row[2].trim(),
              notes: row[3]?.trim()
            });
          }
        }

        await processContacts(contacts);
        toast.success('Contacts uploaded successfully');
      } catch (error) {
        console.error('Error processing CSV:', error);
        toast.error('Error uploading contacts');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await processContacts([newContact]);
      setNewContact({ name: '', email: '', company: '', notes: '' });
      setShowContactForm(false);
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Error adding contact');
    }
  };

  const processContacts = async (contacts: Contact[]) => {
    const factory = AgentFactory.getInstance(supabase);
    
    // Get existing BizDev agent
    const { data: existingAgent } = await supabase
      .from('zen_agents')
      .select('*')
      .eq('email', 'bizdev_agent@system.internal')
      .single();

    if (!existingAgent) {
      throw new Error('BizDev agent not found');
    }

    const bizDevAgent = await factory.getExistingAgent(existingAgent.id);

    // Create a project for this batch of contacts
    const { data: project } = await supabase
      .from('zen_projects')
      .insert({
        name: `BizDev Outreach - ${new Date().toLocaleDateString()}`,
        description: 'Automated BizDev outreach campaign',
        status: 'active',
        category: 'bizdev'
      })
      .select()
      .single();

    // Process each contact
    for (const contact of contacts) {
      // Create user and ticket
      const { data: user } = await supabase
        .from('zen_users')
        .insert({
          name: contact.name,
          email: contact.email,
          role: 'prospect'
        })
        .select()
        .single();

      const { data: ticket } = await supabase
        .from('zen_tickets')
        .insert({
          project_id: project.id,
          title: `Prospect: ${contact.name}`,
          description: `Prospect from ${contact.company}\nEmail: ${contact.email}\nNotes: ${contact.notes || 'No notes'}`,
          status: 'new',
          priority: 'medium',
          category: 'prospect',
          metadata: {
            prospect_data: contact
          },
          client: user.id
        })
        .select()
        .single();

      // Start research process
      await bizDevAgent.execute('research_prospects', {
        projectId: project.id,
        ticketId: ticket.id
      });
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">BizDev Contacts</h3>
          <p className="text-white/60 mt-1">Upload contacts or add them individually</p>
        </div>
        <div className="flex gap-4">
          <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 cursor-pointer">
            <FiUpload className="h-5 w-5 mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          <button
            onClick={() => setShowContactForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            <FiUserPlus className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {showContactForm && (
        <form onSubmit={handleContactSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Name</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Email</label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Company</label>
              <input
                type="text"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Notes</label>
              <input
                type="text"
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowContactForm(false)}
              className="px-4 py-2 text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
            >
              Add Contact
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 text-sm text-white/60">
        <p>CSV format: name, email, company, notes (optional)</p>
        <p>Example: John Doe, john@company.com, Acme Inc., Met at conference</p>
      </div>
    </div>
  );
} 