import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Upload, X } from "lucide-react";
import type { Ticket, TicketAttachment, TicketMainCategory, TicketSubCategory } from "@/types";

interface TicketDetailsFormProps {
  ticket: Ticket;
  attachments: File[];
  isUpdating: boolean;
  onUpdate: (ticketId: string, data: Partial<Ticket>) => void;
  onCancel: () => void;
  onAttachmentAdd: (files: FileList) => void;
  onAttachmentRemove: (index: number) => void;
}

export function TicketDetailsForm({
  ticket,
  attachments,
  isUpdating,
  onUpdate,
  onCancel,
  onAttachmentAdd,
  onAttachmentRemove,
}: TicketDetailsFormProps) {
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    category: ticket.category,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
    });
  }, [ticket]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onUpdate(ticket.id, {
      ...formData,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAttachmentAdd(e.target.files);
    }
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      case "reopened":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        <Badge className={`${getStatusColor(ticket.status)} text-white`}>
          {ticket.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center gap-2">
          Title
          {errors.title && (
            <span className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.title}
            </span>
          )}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={errors.title ? "border-red-500" : ""}
          placeholder="Brief summary of your issue"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="flex items-center gap-2">
          Category
          {errors.category && (
            <span className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.category}
            </span>
          )}
        </Label>
        <Select
          value={`${formData.category.main}/${formData.category.sub}`}
          onValueChange={(value) => {
            const [main, sub] = value.split('/') as [TicketMainCategory, TicketSubCategory[keyof TicketSubCategory]];
            setFormData({ ...formData, category: { main, sub } });
          }}
        >
          <SelectTrigger id="category" className={errors.category ? "border-red-500" : ""}>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technical/api">Technical - API</SelectItem>
            <SelectItem value="technical/data">Technical - Data</SelectItem>
            <SelectItem value="technical/configuration">Technical - Configuration</SelectItem>
            <SelectItem value="technical/integration">Technical - Integration</SelectItem>
            <SelectItem value="technical/connectivity">Technical - Connectivity</SelectItem>
            <SelectItem value="security/access">Security - Access</SelectItem>
            <SelectItem value="security/data">Security - Data</SelectItem>
            <SelectItem value="security/vulnerability">Security - Vulnerability</SelectItem>
            <SelectItem value="security/incident">Security - Incident</SelectItem>
            <SelectItem value="performance/speed">Performance - Speed</SelectItem>
            <SelectItem value="performance/reliability">Performance - Reliability</SelectItem>
            <SelectItem value="performance/optimization">Performance - Optimization</SelectItem>
            <SelectItem value="feature_request/new_feature">Feature Request - New Feature</SelectItem>
            <SelectItem value="feature_request/enhancement">Feature Request - Enhancement</SelectItem>
            <SelectItem value="feature_request/integration">Feature Request - Integration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value as Ticket["priority"] })}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Not time sensitive</SelectItem>
            <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
            <SelectItem value="high">High - Urgent issue</SelectItem>
            <SelectItem value="critical">Critical - System down</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          Description
          {errors.description && (
            <span className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.description}
            </span>
          )}
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`min-h-[150px] ${errors.description ? "border-red-500" : ""}`}
          placeholder="Provide detailed information about your issue"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Attachments</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Add Files
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Update Ticket"}
        </Button>
      </div>
    </form>
  );
} 