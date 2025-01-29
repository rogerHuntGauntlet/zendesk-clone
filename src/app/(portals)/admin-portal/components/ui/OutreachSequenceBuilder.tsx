'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MessageType, MessageTone, SequenceStep, OutreachSequence } from '@/app/types/outreach';
import { Loader2 } from 'lucide-react';

interface OutreachSequenceBuilderProps {
  onSave: (sequence: OutreachSequence) => void;
  initialSequence?: OutreachSequence;
}

export default function OutreachSequenceBuilder({ onSave, initialSequence }: OutreachSequenceBuilderProps) {
  const [sequence, setSequence] = useState<OutreachSequence>(
    initialSequence || {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      steps: [],
      totalDuration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }
  );

  const [currentStep, setCurrentStep] = useState<Partial<SequenceStep>>({
    messageType: 'initial',
    delayDays: 0,
    tone: 'formal',
    template: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationStep, setGenerationStep] = useState('');

  const messageTypes: MessageType[] = [
    'initial',
    'followup',
    'proposal',
    'check_in',
    'milestone',
    'urgent'
  ];

  const tones: MessageTone[] = ['formal', 'casual', 'friendly', 'urgent'];

  const addStep = () => {
    if (!currentStep.template) return;

    const newStep: SequenceStep = {
      id: crypto.randomUUID(),
      messageType: currentStep.messageType as MessageType,
      delayDays: currentStep.delayDays || 0,
      tone: currentStep.tone as MessageTone,
      template: currentStep.template,
      conditions: currentStep.conditions
    };

    const updatedSteps = [...sequence.steps, newStep];
    const totalDuration = updatedSteps.reduce((sum, step) => sum + step.delayDays, 0);

    setSequence(prev => ({
      ...prev,
      steps: updatedSteps,
      totalDuration,
      updatedAt: new Date().toISOString()
    }));

    // Reset current step
    setCurrentStep({
      messageType: 'followup',
      delayDays: 0,
      tone: 'formal',
      template: ''
    });
  };

  const removeStep = (stepId: string) => {
    const updatedSteps = sequence.steps.filter(step => step.id !== stepId);
    const totalDuration = updatedSteps.reduce((sum, step) => sum + step.delayDays, 0);

    setSequence(prev => ({
      ...prev,
      steps: updatedSteps,
      totalDuration,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = () => {
    if (!sequence.name || sequence.steps.length === 0) return;
    onSave(sequence);
  };

  const handleGenerateSequence = async () => {
    if (!sequence.description) return;

    setIsGenerating(true);
    setGenerationError('');
    setGenerationStep('Initializing sequence generation...');

    try {
      const response = await fetch('/api/outreach/sequences/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: sequence.description,
          name: sequence.name
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      let generatedSteps: any[] = [];
      let errorOccurred = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.error) {
              setGenerationError(data.error);
              errorOccurred = true;
              break;
            }

            if (data.step) {
              setGenerationStep(data.step);
            }

            if (data.sequence) {
              generatedSteps = data.sequence;
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
            setGenerationError('Failed to parse server response');
            errorOccurred = true;
            break;
          }
        }

        if (errorOccurred) break;
      }

      if (errorOccurred || generatedSteps.length === 0) {
        throw new Error(generationError || 'No sequence was generated');
      }

      setGenerationStep('Finalizing sequence...');
      
      setSequence(prev => ({
        ...prev,
        steps: generatedSteps.map((step: any) => ({
          id: crypto.randomUUID(),
          messageType: step.messageType,
          delayDays: step.delayDays,
          tone: step.tone,
          template: step.template,
          conditions: step.conditions
        })),
        totalDuration: generatedSteps.reduce((sum: number, step: any) => sum + step.delayDays, 0),
        updatedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error generating sequence:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate sequence');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Sequence Name
          </label>
          <input
            type="text"
            value={sequence.name}
            onChange={(e) => setSequence(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
            placeholder="e.g., New Client Onboarding"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Description
          </label>
          <textarea
            value={sequence.description}
            onChange={(e) => setSequence(prev => ({ ...prev, description: e.target.value }))}
            className="w-full h-24 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
            placeholder="Describe the goal of this sequence and the type of messages you want to send..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleGenerateSequence}
            disabled={!sequence.description || isGenerating}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Sequence...
              </>
            ) : (
              'Generate 5-Email Sequence'
            )}
          </Button>
        </div>

        {isGenerating && !generationError && (
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="text-white/80 font-medium">{generationStep}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {generationError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium">Generation Failed</h4>
                <p className="text-sm text-red-300">{generationError}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setGenerationError('');
                setGenerationStep('');
              }}
              variant="outline"
              className="mt-3 text-red-400 hover:text-red-300"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-lg font-medium text-white mb-4">Sequence Steps</h3>
        
        <div className="space-y-4 mb-6">
          {sequence.steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-4 p-4 bg-white/5 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-white/80">
                    Step {index + 1}:
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300">
                    {step.messageType}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                    {step.tone}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                    +{step.delayDays} days
                  </span>
                </div>
                <div className="text-white/80 text-sm whitespace-pre-wrap">
                  {step.template}
                </div>
              </div>
              <button
                onClick={() => removeStep(step.id)}
                className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-400/10"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4 bg-white/5 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Message Type
              </label>
              <select
                value={currentStep.messageType}
                onChange={(e) => setCurrentStep(prev => ({
                  ...prev,
                  messageType: e.target.value as MessageType
                }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              >
                {messageTypes.map(type => (
                  <option key={type} value={type}>
                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Tone
              </label>
              <select
                value={currentStep.tone}
                onChange={(e) => setCurrentStep(prev => ({
                  ...prev,
                  tone: e.target.value as MessageTone
                }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              >
                {tones.map(tone => (
                  <option key={tone} value={tone}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Delay (Days)
              </label>
              <input
                type="number"
                min="0"
                value={currentStep.delayDays}
                onChange={(e) => setCurrentStep(prev => ({
                  ...prev,
                  delayDays: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Message Template
            </label>
            <textarea
              value={currentStep.template}
              onChange={(e) => setCurrentStep(prev => ({
                ...prev,
                template: e.target.value
              }))}
              className="w-full h-32 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              placeholder="Write your message template here. Use {{variables}} for dynamic content."
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={addStep}
              disabled={!currentStep.template}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Step
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <div className="text-sm text-white/60">
          Total Duration: {sequence.totalDuration} days
        </div>
        <Button
          onClick={handleSave}
          disabled={!sequence.name || sequence.steps.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          Save Sequence
        </Button>
      </div>
    </div>
  );
} 