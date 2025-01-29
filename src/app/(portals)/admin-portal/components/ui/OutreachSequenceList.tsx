'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { OutreachSequence } from '@/app/types/outreach';
import OutreachSequenceBuilder from './OutreachSequenceBuilder';

interface OutreachSequenceListProps {
  sequences: OutreachSequence[];
  onCreateSequence: (sequence: OutreachSequence) => void;
  onUpdateSequence: (sequence: OutreachSequence) => void;
  onExecuteSequence: (sequenceId: string) => void;
  onPauseSequence: (sequenceId: string) => void;
}

export default function OutreachSequenceList({
  sequences,
  onCreateSequence,
  onUpdateSequence,
  onExecuteSequence,
  onPauseSequence
}: OutreachSequenceListProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<OutreachSequence | null>(null);

  const handleSave = (sequence: OutreachSequence) => {
    if (selectedSequence) {
      onUpdateSequence(sequence);
    } else {
      onCreateSequence(sequence);
    }
    setShowBuilder(false);
    setSelectedSequence(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Outreach Sequences</h2>
        <Button
          onClick={() => {
            setSelectedSequence(null);
            setShowBuilder(true);
          }}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Sequence
        </Button>
      </div>

      {showBuilder ? (
        <OutreachSequenceBuilder
          onSave={handleSave}
          initialSequence={selectedSequence || undefined}
        />
      ) : (
        <div className="grid gap-4">
          {sequences.map(sequence => (
            <div
              key={sequence.id}
              className="bg-white/5 rounded-lg p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {sequence.name}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">
                    {sequence.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSequence(sequence);
                      setShowBuilder(true);
                    }}
                    className="text-white/80 hover:text-white"
                  >
                    Edit
                  </Button>
                  {sequence.isActive ? (
                    <Button
                      variant="outline"
                      onClick={() => onPauseSequence(sequence.id)}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      <PauseIcon className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => onExecuteSequence(sequence.id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Start
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Steps:</span>
                  <span className="text-white ml-2">
                    {sequence.steps.length}
                  </span>
                </div>
                <div>
                  <span className="text-white/60">Duration:</span>
                  <span className="text-white ml-2">
                    {sequence.totalDuration} days
                  </span>
                </div>
                <div>
                  <span className="text-white/60">Status:</span>
                  <span className={`ml-2 ${
                    sequence.isActive
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}>
                    {sequence.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  Sequence Steps
                </h4>
                <div className="space-y-2">
                  {sequence.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-white/60">
                        {index + 1}.
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300">
                        {step.messageType}
                      </span>
                      <span className="text-white/80">
                        after {step.delayDays} days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 