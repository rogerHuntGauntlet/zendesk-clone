import { useState, useCallback, useRef, useEffect } from 'react';

interface TaskTracker {
  taskName: string;
  status: 'pending' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

interface TaskUpdate {
  event: 'task_started' | 'task_completed' | 'task_error';
  task: TaskTracker;
}

export const useTaskTracking = () => {
  const [tasks, setTasks] = useState<TaskTracker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number | undefined>();
  const isActive = useRef(false);

  // Reset state when hook is initialized
  useEffect(() => {
    return () => {
      isActive.current = false;
      setTasks([]);
      setTotalDuration(undefined);
      setIsModalOpen(false);
    };
  }, []);

  const handleTaskUpdate = useCallback((update: TaskUpdate) => {
    if (!isActive.current) return;

    if (!update.task || !update.task.taskName) {
      console.error('Invalid task update received:', update);
      return;
    }

    setTasks(currentTasks => {
      const existingTaskIndex = currentTasks.findIndex(t => t.taskName === update.task.taskName);
      let newTasks = [...currentTasks];

      const updatedTask: TaskTracker = {
        taskName: update.task.taskName,
        status: update.event === 'task_started' ? 'pending' :
                update.event === 'task_completed' ? 'completed' :
                update.event === 'task_error' ? 'failed' : 'pending',
        startTime: update.task.startTime || Date.now(),
        endTime: update.task.endTime,
        duration: update.task.duration,
        error: update.task.error
      };

      if (existingTaskIndex === -1) {
        newTasks.push(updatedTask);
      } else {
        newTasks[existingTaskIndex] = {
          ...newTasks[existingTaskIndex],
          ...updatedTask
        };
      }

      return newTasks;
    });

    if (update.event === 'task_completed' && update.task.taskName === 'Overall Message Generation') {
      setTotalDuration(update.task.duration);
    }
  }, []);

  const resetTasks = useCallback(() => {
    setTasks([]);
    setTotalDuration(undefined);
  }, []);

  const openModal = useCallback(() => {
    isActive.current = true;
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    isActive.current = false;
    setIsModalOpen(false);
    resetTasks();
  }, [resetTasks]);

  return {
    tasks,
    totalDuration,
    isModalOpen,
    handleTaskUpdate,
    resetTasks,
    openModal,
    closeModal
  };
}; 