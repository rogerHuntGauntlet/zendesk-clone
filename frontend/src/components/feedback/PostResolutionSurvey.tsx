"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";

interface PostResolutionSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onSubmit: (survey: {
    satisfaction: number;
    resolutionEffective: boolean;
    additionalComments: string;
  }) => void;
}

export function PostResolutionSurvey({ isOpen, onClose, ticketId, onSubmit }: PostResolutionSurveyProps) {
  const [satisfaction, setSatisfaction] = useState(0);
  const [resolutionEffective, setResolutionEffective] = useState<boolean | null>(null);
  const [additionalComments, setAdditionalComments] = useState("");

  const handleSubmit = () => {
    if (satisfaction === 0 || resolutionEffective === null) {
      return; // Add validation feedback if needed
    }
    onSubmit({
      satisfaction,
      resolutionEffective,
      additionalComments,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post Resolution Survey</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>How satisfied were you with the resolution?</Label>
            <StarRating value={satisfaction} onChange={setSatisfaction} />
          </div>

          <div className="space-y-2">
            <Label>Was your issue effectively resolved?</Label>
            <div className="flex gap-4">
              <Button
                variant={resolutionEffective === true ? "default" : "outline"}
                onClick={() => setResolutionEffective(true)}
              >
                Yes
              </Button>
              <Button
                variant={resolutionEffective === false ? "default" : "outline"}
                onClick={() => setResolutionEffective(false)}
              >
                No
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments</Label>
            <Textarea
              id="comments"
              placeholder="Please share any additional feedback about your experience..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
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