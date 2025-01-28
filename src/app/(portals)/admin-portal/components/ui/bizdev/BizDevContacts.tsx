'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/providers';
import { toast } from 'sonner';
import { AgentFactory } from '@/app/ai_agents/core/AgentFactory';
import { FiUpload, FiUserPlus } from 'react-icons/fi';

interface Contact {
  name: string;
  email?: string;
  company: string;
  notes?: string;
  product: string;
}

interface BizDevContactsProps {
  projectId: string;
  onContactsProcessed?: () => void;
}

export default function BizDevContacts({ projectId, onContactsProcessed }: BizDevContactsProps) {
  const supabase = useSupabase();
  const [isUploading, setIsUploading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [newContact, setNewContact] = useState<Contact>({
    name: '',
    email: '',
    company: '',
    notes: '',
    product: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

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
          if (row.length >= 4) {
            contacts.push({
              name: row[0].trim(),
              email: row[1].trim(),
              company: row[2].trim(),
              product: row[3].trim(),
              notes: row[4]?.trim()
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
    setIsProcessing(true);
    setProcessingStatus('Starting contact processing...');
    try {
      await processContacts([newContact]);
      setNewContact({ name: '', email: '', company: '', notes: '', product: '' });
      setShowContactForm(false);
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Error adding contact');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const processContacts = async (contacts: Contact[]) => {
    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to add contacts');
      return;
    }

    try {
      setProcessingStatus('Starting contact processing...');
      const factory = AgentFactory.getInstance(supabase);
      
      setProcessingStatus('Fetching BizDev agent...');
      const { data: existingAgent, error: agentError } = await supabase
        .from('zen_agents')
        .select('*')
        .eq('email', 'bizdev_agent@system.internal')
        .single();

      if (agentError) {
        console.error('BizDev agent fetch error:', agentError);
        throw new Error('BizDev agent not found');
      }

      if (!existingAgent) {
        console.error('No BizDev agent found');
        throw new Error('BizDev agent not found');
      }

      console.log('Found BizDev agent:', existingAgent.id);

      // Process each contact
      for (const contact of contacts) {
        setProcessingStatus(`Processing contact: ${contact.name}...`);
        
        // Create user and ticket
        const { data: user, error: userError } = await supabase
          .from('zen_users')
          .insert({
            name: contact.name,
            email: contact.email || `prospect_${Date.now()}@placeholder.com`,
            role: 'client'
          })
          .select()
          .single();

        if (userError) {
          console.error('Failed to create user:', userError);
          toast.error(`Failed to create user for ${contact.name}`);
          continue;
        }

        setProcessingStatus(`Created user for ${contact.name}...`);

        const { data: ticket, error: ticketError } = await supabase
          .from('zen_tickets')
          .insert({
            project_id: projectId,
            title: `Prospect: ${contact.name}`,
            description: `Prospect Details:
Company: ${contact.company}
Email: ${contact.email || 'No email'}
Product/Service: ${contact.product}
Notes: ${contact.notes || 'No notes'}`,
            status: 'new',
            priority: 'medium',
            category: 'prospect',
            client: user.id,
            created_by: currentUser.id
          })
          .select()
          .single();

        if (ticketError) {
          console.error('Failed to create ticket:', ticketError);
          toast.error(`Failed to create ticket for ${contact.name}`);
          continue;
        }

        setProcessingStatus(`Starting AI research for ${contact.name}...`);

        try {
          const bizDevAgent = await factory.getExistingAgent(existingAgent.id);
          await bizDevAgent.execute('research_prospects', {
            projectId,
            ticketId: ticket.id,
            prospect_data: {
              name: contact.name,
              email: contact.email,
              company: contact.company,
              product: contact.product,
              notes: contact.notes,
              projectId
            }
          });
          setProcessingStatus(`Completed processing ${contact.name}`);
        } catch (error) {
          console.error('AI research error:', error);
          toast.warning(`Contact added, but AI research failed for ${contact.name}. The research will be completed in the background.`);
        }
      }
      
      toast.success('Contacts processed successfully');
      onContactsProcessed?.();
    } catch (error) {
      console.error('Error in processContacts:', error);
      toast.error('Failed to process contacts');
      throw error;
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
          <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <FiUpload className="h-5 w-5 mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              disabled={isUploading || isProcessing}
            />
          </label>
          <button
            onClick={() => setShowContactForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            <FiUserPlus className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="mb-6 p-4 bg-violet-500/10 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500 border-t-transparent"></div>
            <p className="text-white/80">{processingStatus}</p>
          </div>
        </div>
      )}

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
              <label className="block text-sm font-medium text-white mb-1">Email (Optional)</label>
              <input
                type="email"
                value={newContact.email || ''}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              <label className="block text-sm font-medium text-white mb-1">Product/Service</label>
              <input
                type="text"
                value={newContact.product}
                onChange={(e) => setNewContact({ ...newContact, product: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
                placeholder="What are you trying to sell them?"
              />
            </div>
            <div className="md:col-span-2">
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
              className="px-4 py-2 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isProcessing}
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              Add Contact
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 text-sm text-white/60">
        <p>CSV format: name, email, company, product/service, notes (optional)</p>
        <p>Example: John Doe, john@company.com, Acme Inc., Enterprise Software License, Met at conference</p>
      </div>
    </div>
  );
} 