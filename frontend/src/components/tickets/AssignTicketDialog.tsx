"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AssignTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: () => void;
  currentAssignee?: string;
}

export function AssignTicketDialog({
  open,
  onOpenChange,
  onAssign,
  currentAssignee,
}: AssignTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentAssignee ? "Reassign Ticket" : "Assign Ticket"}
          </DialogTitle>
          <DialogDescription>
            {currentAssignee
              ? `Currently assigned to ${currentAssignee}`
              : "Select an agent to assign this ticket to"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            The system will automatically assign this ticket to the most suitable agent based on:
            <ul className="list-disc list-inside mt-2">
              <li>Current workload</li>
              <li>Skill match</li>
              <li>Previous interactions</li>
              <li>Time zone alignment</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onAssign}>
              {currentAssignee ? "Reassign" : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 