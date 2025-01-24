'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import CodeEditor from '@/app/knowledge-base/components/CodeEditor';

interface Question {
  id: string;
  question: string;
  answer_type: 'multiple_choice' | 'text' | 'code';
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  level: string;
  skill_id: string;
}

interface AssessmentInterfaceProps {
  assessment: Assessment;
  onComplete: (passed: boolean, score: number) => void;
}

export default function AssessmentInterface({ assessment, onComplete }: AssessmentInterfaceProps) {
  const supabase = createClientComponentClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('zen_assessment_questions')
        .select('*')
        .eq('assessment_id', assessment.id)
        .order('id');

      if (error) throw error;
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const question of questions) {
        totalPoints += question.points;
        // In a real implementation, you would compare with correct_answer
        // For now, we'll assume all answers are correct if they're not empty
        if (answers[question.id]?.trim()) {
          earnedPoints += question.points;
        }
      }

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= assessment.passing_score;

      // Save results
      const { error } = await supabase
        .from('zen_user_assessment_results')
        .insert({
          user_id: user.id,
          assessment_id: assessment.id,
          score,
          passed,
          answers
        });

      if (error) throw error;

      // If passed, update user skills
      if (passed) {
        await supabase
          .from('zen_user_skills')
          .upsert({
            user_id: user.id,
            skill_id: assessment.skill_id,
            level: assessment.level,
            certified: true
          });
      }

      onComplete(passed, score);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.answer_type) {
      case 'code':
        return (
          <div className="space-y-4">
            <p className="text-white/80">{question.question}</p>
            <CodeEditor
              value={answers[question.id] || ''}
              onChange={(value) => handleAnswerChange(question.id, value)}
              language="typescript"
            />
          </div>
        );
      case 'text':
        return (
          <div className="space-y-4">
            <p className="text-white/80">{question.question}</p>
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full h-32 bg-white/5 text-white border border-white/10 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Enter your answer..."
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{assessment.title}</h2>
          <p className="text-white/60">{assessment.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-white/60">
            <FiClock className="w-5 h-5 mr-2" />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="text-white/60">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/5 rounded-lg p-6">
        {renderQuestion(currentQuestion)}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600"
          >
            Next
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
} 