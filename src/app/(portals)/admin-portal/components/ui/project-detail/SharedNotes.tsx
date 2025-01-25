import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { RichTextEditor } from './RichTextEditor';

interface SharedNotesProps {
  projectId: string;
  currentUser: {
    id: string;
    email: string;
    role: string;
  };
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  user: {
    email: string;
  };
  mentions: string[];
}

interface DatabaseNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  mentions: string[];
  user: {
    email: string;
  };
}

export default function SharedNotes({ projectId, currentUser }: SharedNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadNotes();

    // Set up real-time subscription
    const channel = supabase
      .channel('notes_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'zen_notes',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new note to the bottom of the list
            const newNote = payload.new as DatabaseNote;
            setNotes(prevNotes => [...prevNotes, {
              ...newNote,
              user: {
                email: newNote.user?.email || ''
              }
            }]);
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted note from the list
            setNotes(prevNotes => prevNotes.filter(note => note.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [notes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      // First get the notes
      const { data: notesData, error: notesError } = await supabase
        .from('zen_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (notesError) throw notesError;

      // Then get the user emails for all creators
      const creatorIds = [...new Set(notesData?.map(note => note.created_by) || [])];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', creatorIds);

      if (userError) throw userError;

      // Create a map of user IDs to emails
      const userEmails = new Map(userData?.map(user => [user.id, user.email]));

      // Combine the data
      const formattedNotes = (notesData || []).map(note => ({
        ...note,
        user: {
          email: userEmails.get(note.created_by) || ''
        }
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewNote = (note: Note) => {
    setNotes(prev => [...prev, note]);
  };

  const searchUsers = async (query: string) => {
    if (!query) {
      setMentionUsers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setMentionUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleMentionInput = (text: string) => {
    const mentionMatch = text.match(/@(\w+)$/);
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      searchUsers(mentionMatch[1]);
    } else {
      setMentionSearch('');
      setMentionUsers([]);
    }
  };

  const insertMention = (user: { id: string; email: string }) => {
    const mention = `@${user.email.split('@')[0]}`;
    const lastIndex = newNote.lastIndexOf('@');
    const newContent = newNote.substring(0, lastIndex) + mention + ' ';
    setNewNote(newContent);
    setMentionSearch('');
    setMentionUsers([]);
  };

  const submitNote = async () => {
    if (!newNote.trim()) return;
    if (!projectId) {
      toast.error('Project ID is required to add notes');
      return;
    }

    try {
      // First verify the project exists
      const { data: projectExists, error: projectCheckError } = await supabase
        .from('zen_projects')
        .select('id')
        .eq('id', projectId)
        .single();

      if (projectCheckError || !projectExists) {
        throw new Error('Project not found. Please refresh the page and try again.');
      }

      // Extract mentions from content
      const mentions = newNote.match(/@(\w+)/g)?.map(m => m.substring(1)) || [];
      
      // Create the note
      const { data: noteData, error: noteError } = await supabase
        .from('zen_notes')
        .insert({
          content: newNote,
          created_by: currentUser.id,
          project_id: projectId,
          mentions: mentions
        })
        .select()
        .single();

      if (noteError) {
        console.error('Note creation error:', noteError);
        throw new Error('Failed to create note');
      }

      setNewNote('');
      toast.success('Note added successfully');

      // Add the new note to the list at the bottom
      if (noteData) {
        setNotes(prevNotes => [...prevNotes, {
          ...noteData,
          user: {
            email: currentUser.email
          }
        }]);
      }
    } catch (error) {
      console.error('Error submitting note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit note');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No shared notes yet. Start the conversation!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`flex flex-col ${
                note.created_by === currentUser.id ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  note.created_by === currentUser.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-white'
                }`}
              >
                <div className="text-sm text-white/60 mb-1">
                  {note.user.email} • {format(new Date(note.created_at), 'MMM d, h:mm a')}
                </div>
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: note.content }} />
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="relative">
          <RichTextEditor
            value={newNote}
            onChange={(value: string) => {
              setNewNote(value);
              handleMentionInput(value);
            }}
            placeholder="Type your note here... Use @ to mention someone"
          />
          
          {mentionUsers.length > 0 && (
            <div className="absolute bottom-full left-0 w-64 bg-gray-800 rounded-lg shadow-lg mb-2 overflow-hidden">
              {mentionUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white"
                >
                  {user.email}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={submitNote}
            disabled={!newNote.trim()}
            className="mt-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Note
          </button>
        </div>
      </div>
    </div>
  );
} 