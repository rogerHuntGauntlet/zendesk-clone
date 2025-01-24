import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';

interface Template {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
}

interface ResponseTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
}

export function ResponseTemplates({ isOpen, onClose, onSelectTemplate }: ResponseTemplatesProps) {
  const supabase = createClientComponentClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredTemplates(
        templates.filter(template => 
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchQuery, templates]);

  const loadTemplates = async () => {
    try {
      const { data: templates, error } = await supabase
        .from('zen_response_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(templates || []);
      setFilteredTemplates(templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('zen_response_templates')
        .insert({
          title: newTemplate.title,
          content: newTemplate.content,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Template created successfully');
      setIsCreateModalOpen(false);
      setNewTemplate({ title: '', content: '' });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('zen_response_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        
        <Dialog.Panel className="relative bg-gray-900 rounded-lg w-full max-w-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-medium text-white">
                Response Templates
              </Dialog.Title>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
              >
                Create Template
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <svg 
                  className="absolute left-3 top-2.5 w-4 h-4 text-white/40" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-800/50 rounded-lg p-4 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-white">{template.title}</h5>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectTemplate(template.content)}
                        className="px-2 py-1 text-xs bg-violet-600/20 text-violet-400 rounded hover:bg-violet-600/30"
                      >
                        Use Template
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div 
                    className="text-sm text-white/60 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: template.content }}
                  />
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  {searchQuery ? 'No templates found matching your search' : 'No templates yet'}
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Create Template Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="fixed inset-0 z-[60] overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          
          <Dialog.Panel className="relative bg-gray-900 rounded-lg w-full max-w-md">
            <div className="p-6">
              <Dialog.Title className="text-lg font-medium text-white mb-4">
                Create Response Template
              </Dialog.Title>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter template name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Template Content
                  </label>
                  <RichTextEditor
                    value={newTemplate.content}
                    onChange={(content) => setNewTemplate(prev => ({ ...prev, content }))}
                    placeholder="Enter template content..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={isLoading || !newTemplate.title || !newTemplate.content}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-violet-700"
                >
                  {isLoading ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  );
} 