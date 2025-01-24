'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiSend, FiCheck } from 'react-icons/fi';
import CodeEditor from './CodeEditor';
import ReactMarkdown from 'react-markdown';

interface InteractiveExerciseProps {
  content: string;
  materialId: string;
  onComplete: () => void;
}

export default function InteractiveExercise({ content, materialId, onComplete }: InteractiveExerciseProps) {
  const supabase = createClientComponentClient();
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save progress
      const { error } = await supabase
        .from('zen_user_progress')
        .upsert({
          user_id: user.id,
          material_id: materialId,
          status: 'completed',
          notes: answer
        });

      if (error) throw error;

      setFeedback('Exercise completed successfully!');
      onComplete();
    } catch (error) {
      console.error('Error submitting exercise:', error);
      setFeedback('Failed to submit exercise. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Exercise Content */}
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* Answer Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Your Solution</h3>
        {content.includes('```') ? (
          <CodeEditor
            value={answer}
            onChange={setAnswer}
            language="typescript"
          />
        ) : (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full h-64 bg-white/5 text-white border border-white/10 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Enter your solution..."
          />
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <FiSend className="w-4 h-4" />
              <span>Submit Solution</span>
            </>
          )}
        </button>

        {feedback && (
          <div className="flex items-center space-x-2 text-green-400">
            <FiCheck className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
} 