import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@radix-ui/react-progress";
import { ScrollArea } from "@radix-ui/react-scroll-area";

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
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Task Progress</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-400">{completedTasks} completed</span>
            <span className="text-red-400">{failedTasks} failed</span>
            <span className="text-yellow-400">{pendingTasks} pending</span>
          </div>
        </div>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div
                key={`${task.taskName}-${index}`}
                className="border border-white/10 rounded-lg p-4 bg-gray-800/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white">{task.taskName}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                  >
                    {task.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{new Date(task.startTime).toLocaleTimeString()}</span>
                  </div>
                  
                  {task.endTime && (
                    <div className="flex justify-between">
                      <span>Ended:</span>
                      <span>{new Date(task.endTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                  
                  {task.duration !== undefined && (
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{formatDuration(task.duration)}</span>
                    </div>
                  )}
                  
                  {task.error && (
                    <div className="mt-2 text-red-400 bg-red-500/10 rounded p-2">
                      {task.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {totalDuration !== undefined && (
          <div className="mt-4 pt-4 border-t border-white/10">
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