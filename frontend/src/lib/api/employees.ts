import type { Employee, Ticket } from "@/types/tickets";

type WorkloadAdjustment = {
  employeeId: string;
  reason: string;
  suggestedAction: string;
};

type WorkloadCallback = (adjustments: WorkloadAdjustment[]) => void;

class EmployeeManager {
  private callbacks: WorkloadCallback[] = [];

  async assignTicket(ticketId: string, ticket: Ticket): Promise<Employee | null> {
    // For demo, just return a mock employee
    return {
      id: 'emp-1',
      email: 'john@company.com',
      name: 'John Smith',
      role: 'employee',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      department: 'Technical Support',
      specialties: ['JavaScript', 'React', 'Node.js'],
      activeTickets: 3,
      performance: {
        resolvedTickets: 45,
        avgResponseTime: '2h 15m',
        customerRating: 4.8
      }
    };
  }

  async monitorTeamCapacity(): Promise<void> {
    // Mock monitoring logic
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.notifyWorkloadAdjustments([{
          employeeId: 'emp-1',
          reason: 'High ticket volume detected',
          suggestedAction: 'Consider redistributing tickets'
        }]);
      }
    }, 30000); // Check every 30 seconds
  }

  onWorkloadAdjustmentsNeeded(callback: WorkloadCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private notifyWorkloadAdjustments(adjustments: WorkloadAdjustment[]): void {
    this.callbacks.forEach(callback => callback(adjustments));
  }
}

export const employeeManager = new EmployeeManager(); 