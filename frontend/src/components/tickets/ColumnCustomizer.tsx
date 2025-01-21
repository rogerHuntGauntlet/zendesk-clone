import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable, DroppableProvided } from '@hello-pangea/dnd';
import { GripVertical, Save, Undo, Plus } from 'lucide-react';
import { columnConfig, type ColumnConfig, type ColumnPreset } from '@/lib/column-config';

interface ColumnCustomizerProps {
  onClose: () => void;
}

export function ColumnCustomizer({ onClose }: ColumnCustomizerProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [presets, setPresets] = useState<ColumnPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  useEffect(() => {
    setColumns(columnConfig.getColumnConfig());
    setPresets(columnConfig.getPresets());
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setColumns(updatedItems);
    columnConfig.saveColumnConfig(updatedItems);
  };

  const handleVisibilityChange = (columnId: string, visible: boolean) => {
    const updated = columnConfig.updateColumnVisibility(columnId, visible);
    setColumns(updated);
  };

  const handleWidthChange = (columnId: string, width: string) => {
    const numWidth = parseInt(width, 10);
    if (!isNaN(numWidth)) {
      const updated = columnConfig.updateColumnWidth(columnId, numWidth);
      setColumns(updated);
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset = columnConfig.savePreset({
      name: newPresetName,
      columns: columns
    });

    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setShowPresetInput(false);
  };

  const handleApplyPreset = (presetId: string) => {
    const updated = columnConfig.applyPreset(presetId);
    setColumns(updated);
  };

  const handleReset = () => {
    const defaultColumns = columnConfig.resetToDefault();
    setColumns(defaultColumns);
  };

  return (
    <Card className="p-4 w-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Customize Columns</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <Undo className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresetInput(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Save Preset
          </Button>
        </div>
      </div>

      {showPresetInput && (
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
          />
          <Button onClick={handleSavePreset}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      )}

      {presets.length > 0 && (
        <div className="mb-4">
          <Label>Saved Presets</Label>
          <div className="flex gap-2 mt-2">
            {presets.map(preset => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset(preset.id)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
          <Separator className="my-4" />
        </div>
      )}

      <ScrollArea className="h-[400px] pr-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {columns.map((column, index) => (
                  <Draggable
                    key={column.id}
                    draggableId={column.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-4 bg-secondary/20 p-2 rounded-md"
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <Label>{column.title}</Label>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-20">
                            <Input
                              type="number"
                              value={column.width || ''}
                              onChange={(e) => handleWidthChange(column.id, e.target.value)}
                              placeholder="Width"
                              className="h-8"
                            />
                          </div>
                          <Switch
                            checked={column.visible}
                            onCheckedChange={(checked) => handleVisibilityChange(column.id, checked)}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>
          Done
        </Button>
      </div>
    </Card>
  );
} 