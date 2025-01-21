import { wsService } from './websocket';
import { api } from './api';

interface BreakSuggestion {
  type: 'SHORT_BREAK' | 'LONG_BREAK';
  reason: string;
  suggestedDuration: number;
}

interface WorkloadMetrics {
  ticketsHandled: number;
  averageResponseTime: number;
  activeTime: number;
  focusScore: number;
}

class AgentProductivityService {
  private lastBreak: Date | null = null;
  private focusModeActive = false;
  private workStartTime: Date | null = null;
  
  constructor() {
    this.workStartTime = new Date();
    this.initializeBreakMonitoring();
    this.initializeWorkloadTracking();
  }

  private initializeBreakMonitoring() {
    setInterval(() => {
      const timeSinceLastBreak = this.lastBreak 
        ? (new Date().getTime() - this.lastBreak.getTime()) / (1000 * 60)
        : (new Date().getTime() - this.workStartTime!.getTime()) / (1000 * 60);

      if (timeSinceLastBreak > 90) { // 1.5 hours
        this.suggestBreak('LONG_BREAK', 'You have been working for 1.5 hours straight');
      } else if (timeSinceLastBreak > 45) { // 45 minutes
        this.suggestBreak('SHORT_BREAK', 'Time for a quick break to maintain productivity');
      }
    }, 300000); // Check every 5 minutes
  }

  private initializeWorkloadTracking() {
    let ticketCount = 0;
    let activeStartTime: Date | null = null;

    document.addEventListener('mousemove', () => {
      if (!activeStartTime) {
        activeStartTime = new Date();
      }
    });

    document.addEventListener('keypress', () => {
      if (!activeStartTime) {
        activeStartTime = new Date();
      }
    });

    setInterval(() => {
      if (activeStartTime) {
        const activeTime = (new Date().getTime() - activeStartTime.getTime()) / (1000 * 60);
        if (activeTime > 25) { // 25 minutes of continuous activity
          this.suggestBreak('SHORT_BREAK', 'You have been actively working for 25 minutes');
        }
      }
    }, 60000); // Check every minute
  }

  private suggestBreak(type: BreakSuggestion['type'], reason: string) {
    wsService.send({
      type: 'BREAK_SUGGESTION',
      payload: {
        type,
        reason,
        suggestedDuration: type === 'SHORT_BREAK' ? 5 : 15
      }
    });
  }

  toggleFocusMode() {
    this.focusModeActive = !this.focusModeActive;
    return this.focusModeActive;
  }

  async getWorkloadMetrics(): Promise<WorkloadMetrics> {
    // In a real implementation, this would fetch from your backend
    return {
      ticketsHandled: 0,
      averageResponseTime: 0,
      activeTime: 0,
      focusScore: 0
    };
  }

  recordBreak() {
    this.lastBreak = new Date();
  }
}

export const agentService = new AgentProductivityService(); 