import { wsService } from './websocket';

export interface ColumnConfig {
  id: string;
  title: string;
  field: string;
  visible: boolean;
  width?: number;
  order: number;
}

export interface ColumnPreset {
  id: string;
  name: string;
  columns: ColumnConfig[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'id', title: 'Ticket ID', field: 'id', visible: true, order: 0 },
  { id: 'title', title: 'Title', field: 'title', visible: true, order: 1 },
  { id: 'status', title: 'Status', field: 'status', visible: true, order: 2 },
  { id: 'priority', title: 'Priority', field: 'priority', visible: true, order: 3 },
  { id: 'client', title: 'Client', field: 'client', visible: true, order: 4 },
  { id: 'createdAt', title: 'Created', field: 'createdAt', visible: true, order: 5 },
  { id: 'updatedAt', title: 'Updated', field: 'updatedAt', visible: true, order: 6 },
  { id: 'category', title: 'Category', field: 'category', visible: false, order: 7 },
  { id: 'assignedTo', title: 'Assigned To', field: 'assignedTo', visible: false, order: 8 },
  { id: 'tags', title: 'Tags', field: 'tags', visible: false, order: 9 }
];

class ColumnConfigService {
  private storageKey = 'column_config';
  private presetStorageKey = 'column_presets';

  constructor() {
    // Initialize default config if none exists
    if (!localStorage.getItem(this.storageKey)) {
      this.saveColumnConfig(DEFAULT_COLUMNS);
    }
  }

  getColumnConfig(): ColumnConfig[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  }

  saveColumnConfig(config: ColumnConfig[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(config));
    wsService.send({
      type: 'COLUMN_CONFIG_UPDATE',
      payload: { config }
    });
  }

  getPresets(): ColumnPreset[] {
    const stored = localStorage.getItem(this.presetStorageKey);
    return stored ? JSON.parse(stored) : [];
  }

  savePreset(preset: Omit<ColumnPreset, 'id'>): ColumnPreset {
    const presets = this.getPresets();
    const newPreset: ColumnPreset = {
      id: Math.random().toString(36).substring(7),
      ...preset
    };
    presets.push(newPreset);
    localStorage.setItem(this.presetStorageKey, JSON.stringify(presets));
    return newPreset;
  }

  applyPreset(presetId: string): ColumnConfig[] {
    const presets = this.getPresets();
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      this.saveColumnConfig(preset.columns);
      return preset.columns;
    }
    return this.getColumnConfig();
  }

  resetToDefault(): ColumnConfig[] {
    this.saveColumnConfig(DEFAULT_COLUMNS);
    return DEFAULT_COLUMNS;
  }

  updateColumnVisibility(columnId: string, visible: boolean): ColumnConfig[] {
    const config = this.getColumnConfig();
    const updated = config.map(col => 
      col.id === columnId ? { ...col, visible } : col
    );
    this.saveColumnConfig(updated);
    return updated;
  }

  updateColumnOrder(columnId: string, newOrder: number): ColumnConfig[] {
    const config = this.getColumnConfig();
    const column = config.find(col => col.id === columnId);
    if (!column) return config;

    const updated = config.map(col => {
      if (col.id === columnId) {
        return { ...col, order: newOrder };
      }
      if (col.order >= newOrder) {
        return { ...col, order: col.order + 1 };
      }
      return col;
    }).sort((a, b) => a.order - b.order);

    this.saveColumnConfig(updated);
    return updated;
  }

  updateColumnWidth(columnId: string, width: number): ColumnConfig[] {
    const config = this.getColumnConfig();
    const updated = config.map(col => 
      col.id === columnId ? { ...col, width } : col
    );
    this.saveColumnConfig(updated);
    return updated;
  }
}

export const columnConfig = new ColumnConfigService(); 