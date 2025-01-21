import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntry, CostEntry } from "@/types/tickets";

interface TimeAndCostTrackingProps {
  ticketId: string;
  onAddTimeEntry: (entry: Omit<TimeEntry, "id">) => void;
  onAddCostEntry: (entry: Omit<CostEntry, "id">) => void;
  timeEntries: TimeEntry[];
  costEntries: CostEntry[];
}

export function TimeAndCostTracking({
  ticketId,
  onAddTimeEntry,
  onAddCostEntry,
  timeEntries,
  costEntries,
}: TimeAndCostTrackingProps) {
  const [activity, setActivity] = useState<TimeEntry["activity"]>("research");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [category, setCategory] = useState<"internal" | "client">("client");

  const [costType, setCostType] = useState<CostEntry["type"]>("labor");
  const [costDescription, setCostDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [costBillable, setCostBillable] = useState(true);
  const [costCategory, setCostCategory] = useState<"internal" | "client">("client");

  const handleAddTimeEntry = () => {
    if (!description || !duration) return;

    onAddTimeEntry({
      ticketId,
      userId: "current-user", // This should come from auth context
      activity,
      description,
      startTime: new Date().toISOString(),
      duration: parseInt(duration),
      billable: isBillable,
      category,
    });

    setDescription("");
    setDuration("");
  };

  const handleAddCostEntry = () => {
    if (!costDescription || !amount) return;

    onAddCostEntry({
      ticketId,
      type: costType,
      description: costDescription,
      amount: parseFloat(amount),
      currency,
      billable: costBillable,
      category: costCategory,
      createdAt: new Date().toISOString(),
      createdBy: "current-user", // This should come from auth context
    });

    setCostDescription("");
    setAmount("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity</Label>
                <Select value={activity} onValueChange={(value: TimeEntry["activity"]) => setActivity(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Enter duration"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work done"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                />
                Billable
              </label>
              <Select value={category} onValueChange={(value: "internal" | "client") => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddTimeEntry}>Add Time Entry</Button>

            {timeEntries.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recent Time Entries</h4>
                <div className="space-y-2">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex justify-between">
                        <span>{entry.description}</span>
                        <span>{entry.duration} minutes</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.activity} - {entry.billable ? "Billable" : "Non-billable"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Type</Label>
                <Select value={costType} onValueChange={(value: CostEntry["type"]) => setCostType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cost type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  <Select value={currency} onValueChange={(value) => setCurrency(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={costDescription}
                onChange={(e) => setCostDescription(e.target.value)}
                placeholder="Describe the cost"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={costBillable}
                  onChange={(e) => setCostBillable(e.target.checked)}
                />
                Billable
              </label>
              <Select value={costCategory} onValueChange={(value: "internal" | "client") => setCostCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddCostEntry}>Add Cost Entry</Button>

            {costEntries.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recent Cost Entries</h4>
                <div className="space-y-2">
                  {costEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex justify-between">
                        <span>{entry.description}</span>
                        <span>
                          {entry.amount} {entry.currency}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.type} - {entry.billable ? "Billable" : "Non-billable"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 