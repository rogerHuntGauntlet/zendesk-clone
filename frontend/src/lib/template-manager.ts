import { mockResponseTemplates } from './mock-data';

export interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  tags: string[];
  versions: TemplateVersion[];
  currentVersion: string;
}

interface TemplateVersion {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  comment?: string;
}

export interface TemplateUsageStats {
  usageCount: number;
  lastUsed?: string;
  successRate: number;
  avgResponseTime: number;
  avgSatisfactionScore: number;
}

class TemplateManagerService {
  private storageKey = 'response_templates';
  private usageKey = 'template_usage';

  constructor() {
    // Initialize storage with mock data if empty
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(mockResponseTemplates));
    }
    if (!localStorage.getItem(this.usageKey)) {
      localStorage.setItem(this.usageKey, JSON.stringify({}));
    }
  }

  async getTemplates(): Promise<ResponseTemplate[]> {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  async getTemplate(id: string): Promise<ResponseTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async createTemplate(data: Omit<ResponseTemplate, 'id' | 'versions' | 'currentVersion'> & { content: string, createdBy: string }): Promise<ResponseTemplate> {
    const templates = await this.getTemplates();
    const newTemplate: ResponseTemplate = {
      id: `template-${Date.now()}`,
      ...data,
      versions: [{
        id: 'v1',
        content: data.content,
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy
      }],
      currentVersion: 'v1'
    };
    
    templates.push(newTemplate);
    this.saveTemplates(templates);
    return newTemplate;
  }

  async updateTemplate(id: string, update: { content: string, createdBy: string, comment?: string }): Promise<ResponseTemplate> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === id);
    if (!template) throw new Error('Template not found');

    const newVersion = {
      id: `v${template.versions.length + 1}`,
      content: update.content,
      createdAt: new Date().toISOString(),
      createdBy: update.createdBy
    };

    template.versions.push(newVersion);
    template.currentVersion = newVersion.id;

    this.saveTemplates(templates);
    return template;
  }

  async revertToVersion(templateId: string, versionId: string): Promise<ResponseTemplate> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const version = template.versions.find(v => v.id === versionId);
    if (!version) throw new Error('Version not found');

    template.currentVersion = versionId;
    this.saveTemplates(templates);
    return template;
  }

  // Usage tracking
  async recordUsage(templateId: string, data: {
    responseTime: number;
    wasSuccessful: boolean;
    satisfactionScore?: number;
  }): Promise<void> {
    const usageData = await this.getUsageStats();
    const templateStats = usageData[templateId] || {
      usageCount: 0,
      successRate: 0,
      avgResponseTime: 0,
      avgSatisfactionScore: 0
    };

    // Update stats
    templateStats.usageCount++;
    templateStats.lastUsed = new Date().toISOString();
    
    // Update success rate
    const totalSuccesses = templateStats.successRate * (templateStats.usageCount - 1) + (data.wasSuccessful ? 1 : 0);
    templateStats.successRate = totalSuccesses / templateStats.usageCount;
    
    // Update response time
    templateStats.avgResponseTime = (
      (templateStats.avgResponseTime * (templateStats.usageCount - 1) + data.responseTime) /
      templateStats.usageCount
    );

    // Update satisfaction score if provided
    if (data.satisfactionScore) {
      templateStats.avgSatisfactionScore = (
        (templateStats.avgSatisfactionScore * (templateStats.usageCount - 1) + data.satisfactionScore) /
        templateStats.usageCount
      );
    }

    usageData[templateId] = templateStats;
    localStorage.setItem(this.usageKey, JSON.stringify(usageData));
  }

  async getUsageStats(): Promise<Record<string, TemplateUsageStats>> {
    const stored = localStorage.getItem(this.usageKey);
    return stored ? JSON.parse(stored) : {};
  }

  private saveTemplates(templates: ResponseTemplate[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
  }
}

export const templateManager = new TemplateManagerService(); 