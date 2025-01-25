'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiArrowLeft } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LearningMaterial {
  id: string;
  title: string;
  content: string;
  type: string;
  path_id: string;
  order_index: number;
}

interface UserProgress {
  id: string;
  user_id: string;
  material_id: string;
  status: string;
  score?: number;
  notes?: string;
}

export default function MaterialDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterialDetails = async () => {
      try {
        setLoading(true);
        // Get user session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch material details
        const { data: materialData, error: materialError } = await supabase
          .from('zen_learning_materials')
          .select('*')
          .eq('id', params.id)
          .single();

        if (materialError) throw materialError;
        setMaterial(materialData);

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('zen_user_progress')
          .select('*')
          .eq('material_id', params.id)
          .eq('user_id', user.id)
          .single();

        if (progressError && progressError.code !== 'PGRST116') { // Ignore "not found" error
          throw progressError;
        }
        setUserProgress(progressData);

        // If no progress exists, create initial progress
        if (!progressData) {
          const { data: newProgress, error: createError } = await supabase
            .from('zen_user_progress')
            .insert([{
              user_id: user.id,
              material_id: params.id,
              status: 'in_progress'
            }])
            .select()
            .single();

          if (createError) throw createError;
          setUserProgress(newProgress);
        }
      } catch (error) {
        console.error('Error fetching material details:', error);
        setError('Failed to load material details');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialDetails();
  }, [params.id, supabase]);

  const updateProgress = async (status: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('zen_user_progress')
        .update({ status })
        .eq('material_id', params.id)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserProgress(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="space-y-6">
              <div className="h-32 bg-white/10 rounded-lg"></div>
              <div className="h-64 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Material not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Back to Skill
        </button>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">{material.title}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {material.type}
            </span>
            {userProgress && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                userProgress.status === 'completed' 
                  ? 'bg-green-500/10 text-green-400'
                  : userProgress.status === 'in_progress'
                  ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-white/10 text-white'
              }`}>
                {userProgress.status.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="prose prose-invert prose-pre:p-0 prose-pre:bg-transparent max-w-none mb-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Style links to be visible on dark background
                a: ({ node, ...props }) => (
                  <a className="text-blue-400 hover:text-blue-300" {...props} />
                ),
                // Add spacing between elements
                p: ({ node, ...props }) => (
                  <p className="mb-4" {...props} />
                ),
                // Style headings
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold mt-6 mb-3" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-bold mt-4 mb-2" {...props} />
                ),
                // Style lists
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-4" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-4" {...props} />
                ),
                // Style blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-white/20 pl-4 italic my-4" {...props} />
                ),
              }}
            >
              {material.content}
            </ReactMarkdown>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => updateProgress('in_progress')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                userProgress?.status === 'in_progress'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
              }`}
            >
              Mark as In Progress
            </button>
            <button
              onClick={() => updateProgress('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                userProgress?.status === 'completed'
                  ? 'bg-green-500 text-black'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              }`}
            >
              Mark as Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 