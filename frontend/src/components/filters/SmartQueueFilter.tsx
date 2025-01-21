import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Share2, X, Plus, Filter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface FilterPreset {
  id: string;
  name: string;
  conditions: FilterCondition[];
  isShared: boolean;
  createdBy: string;
}

interface SmartQueueFilterProps {
  onFilterChange: (conditions: FilterCondition[]) => void;
}

const FILTER_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'category', label: 'Category' },
  { value: 'assignedTo', label: 'Assigned To' },
  { value: 'client', label: 'Client' },
  { value: 'lastUpdate', label: 'Last Update' },
  { value: 'responses', label: 'Response Count' }
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' }
];

export function SmartQueueFilter({ onFilterChange }: SmartQueueFilterProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('filterPresets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  const addCondition = () => {
    setConditions([...conditions, { field: 'status', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    onFilterChange(newConditions);
  };

  const updateCondition = (index: number, field: keyof FilterCondition, value: string) => {
    const newConditions = conditions.map((condition, i) => {
      if (i === index) {
        return { ...condition, [field]: value };
      }
      return condition;
    });
    setConditions(newConditions);
    onFilterChange(newConditions);
  };

  const savePreset = () => {
    if (!presetName) {
      toast({
        title: "Error",
        description: "Please enter a name for your filter preset",
        variant: "destructive",
      });
      return;
    }

    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: presetName,
      conditions: conditions,
      isShared: false,
      createdBy: 'current-user' // Replace with actual user ID
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('filterPresets', JSON.stringify(updatedPresets));
    setPresetName("");

    toast({
      title: "Success",
      description: "Filter preset saved successfully",
    });
  };

  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setConditions(preset.conditions);
      onFilterChange(preset.conditions);
      setSelectedPreset(presetId);
    }
  };

  const sharePreset = (presetId: string) => {
    const updatedPresets = presets.map(preset => {
      if (preset.id === presetId) {
        return { ...preset, isShared: true };
      }
      return preset;
    });
    setPresets(updatedPresets);
    localStorage.setItem('filterPresets', JSON.stringify(updatedPresets));

    toast({
      title: "Success",
      description: "Filter preset shared with team",
    });
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Filter Conditions */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={condition.field}
              onValueChange={(value) => updateCondition(index, 'field', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_FIELDS.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={condition.operator}
              onValueChange={(value) => updateCondition(index, 'operator', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Value"
              value={condition.value}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className="flex-1"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" onClick={addCondition} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      {/* Presets Management */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Preset name..."
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={savePreset} disabled={!presetName}>
          <Save className="h-4 w-4 mr-2" />
          Save Preset
        </Button>
      </div>

      {/* Saved Presets */}
      <div className="space-y-2">
        <h3 className="font-semibold">Saved Presets</h3>
        <div className="space-y-2">
          {presets.map(preset => (
            <div key={preset.id} className="flex items-center justify-between bg-secondary p-2 rounded-md">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{preset.name}</span>
                {preset.isShared && (
                  <Badge variant="secondary">Shared</Badge>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPreset(preset.id)}
                >
                  Load
                </Button>
                {!preset.isShared && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sharePreset(preset.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 