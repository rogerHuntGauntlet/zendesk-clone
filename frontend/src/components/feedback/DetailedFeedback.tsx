"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";

interface DetailedFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onSubmit: (feedback: {
    category: string;
    rating: number;
    comment: string;
    suggestions: string;
  }) => void;
}

export function DetailedFeedback({ isOpen, onClose, ticketId, onSubmit }: DetailedFeedbackProps) {
  const [category, setCategory] = useState("agent_performance");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      return; // Add validation feedback if needed
    }
    onSubmit({
      category,
      rating,
      comment,
      suggestions,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detailed Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="agent_performance">Agent Performance</option>
              <option value="response_time">Response Time</option>
              <option value="solution_quality">Solution Quality</option>
              <option value="communication">Communication</option>
              <option value="system_usability">System Usability</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comments</Label>
            <Textarea
              id="comment"
              placeholder="Please share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestions">Suggestions for Improvement</Label>
            <Textarea
              id="suggestions"
              placeholder="How can we improve our service?"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 