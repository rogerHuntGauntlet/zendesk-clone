import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@radix-ui/react-progress";

interface TaskTracker {
  taskName: string;
  status: 'pending' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

interface TaskTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskTracker[];
  totalDuration?: number;
}

const TaskTrackingModal = memo(function TaskTrackingModal({
  isOpen,
  onClose,
  tasks,
  totalDuration,
}: TaskTrackingModalProps) {
  if (!isOpen) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const totalTasks = tasks.length;
  
  const progress = totalTasks > 0 ? ((completedTasks + failedTasks) / totalTasks) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'failed':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 text-white">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">Task Progress</DialogTitle>
        </DialogHeader>
        
        <div className="mb-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1 text-sm">
            <span className="text-green-400">{completedTasks} completed</span>
            <span className="text-red-400">{failedTasks} failed</span>
            <span className="text-yellow-400">{pendingTasks} pending</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[300px]">
          {tasks.map((task, index) => (
            <div
              key={`${task.taskName}-${index}`}
              className="border border-white/10 rounded-lg p-3 bg-gray-800/50 mb-2 last:mb-0"
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-white">{task.taskName}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                >
                  {task.status}
                </span>
              </div>
              
              <div className="space-y-0.5 text-sm text-gray-300">
                {task.duration !== undefined && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{formatDuration(task.duration)}</span>
                  </div>
                )}
                
                {task.error && (
                  <div className="mt-1 text-red-400 bg-red-500/10 rounded p-2 text-xs">
                    {task.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalDuration !== undefined && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Duration:</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

TaskTrackingModal.displayName = 'TaskTrackingModal';

export default TaskTrackingModal; 