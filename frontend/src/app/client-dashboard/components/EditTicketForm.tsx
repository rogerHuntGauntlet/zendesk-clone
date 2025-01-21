import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import type { Ticket, TicketStatus } from "@/types/tickets";

interface EditTicketFormProps {
  ticket: Ticket;
  onSubmit: (ticketId: string, data: {
    title: string;
    description: string;
    priority: Ticket['priority'];
    status: Ticket['status'];
    category: string;
    attachments: File[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function EditTicketForm({ ticket, onSubmit, onCancel }: EditTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category,
    attachments: [] as File[],
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(ticket.id, ticketData);
    } catch (error) {
      console.error('Failed to update ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTicketData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeFile = (index: number) => {
    setTicketData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={ticketData.title}
            onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={ticketData.category}
            onValueChange={(value) => setTicketData({ ...ticketData, category: value })}
          >
            <SelectTrigger id="category" className="bg-gray-50 dark:bg-gray-700">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical Issue">Technical Issue</SelectItem>
              <SelectItem value="Account">Account</SelectItem>
              <SelectItem value="Billing">Billing</SelectItem>
              <SelectItem value="Feature Request">Feature Request</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={ticketData.priority}
            onValueChange={(value) => setTicketData({ ...ticketData, priority: value as Ticket["priority"] })}
          >
            <SelectTrigger id="priority" className="bg-gray-50 dark:bg-gray-700">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low - Not time sensitive</SelectItem>
              <SelectItem value="Medium">Medium - Needs attention soon</SelectItem>
              <SelectItem value="High">High - Urgent issue</SelectItem>
              <SelectItem value="Critical">Critical - System down</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={ticketData.status}
            onValueChange={(value) => setTicketData({ ...ticketData, status: value as TicketStatus })}
          >
            <SelectTrigger id="status" className="bg-gray-50 dark:bg-gray-700">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="reopened">Reopened</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={ticketData.description}
          onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
          className="bg-gray-50 dark:bg-gray-700 min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments">Upload Files</Label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Label
              htmlFor="attachments"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              Choose files
            </Label>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            or drag and drop files here
          </p>
        </div>
        {ticketData.attachments.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">New Files:</h4>
            <div className="space-y-2">
              {ticketData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Ticket'
          )}
        </Button>
      </div>
    </div>
  );
} 