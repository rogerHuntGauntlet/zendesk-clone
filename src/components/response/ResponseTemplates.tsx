import * as React from "react";
import { Search, Plus, Edit2, Trash2, Star, StarOff, BarChart2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { templateManager } from "@/lib/api/templates";
import { TemplateAnalytics } from "@/components/templates/TemplateAnalytics";
import { TemplateVersions } from "@/components/templates/TemplateVersions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  content: string;
  shortcut?: string;
  category: string;
  isFavorite: boolean;
}

interface ResponseTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

export function ResponseTemplates({ onSelectTemplate }: ResponseTemplatesProps) {
  const [templates, setTemplates] = React.useState<Template[]>([
    {
      id: "1",
      name: "General Greeting",
      content: "Hello {customer_name},\n\nThank you for reaching out to our support team.",
      shortcut: "!greet",
      category: "General",
      isFavorite: true,
    },
    {
      id: "2",
      name: "Technical Issue",
      content: "I understand you're experiencing technical difficulties. Let me help you resolve this.",
      shortcut: "!tech",
      category: "Technical",
      isFavorite: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [isAddingTemplate, setIsAddingTemplate] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [selectedTab, setSelectedTab] = React.useState<"templates" | "analytics" | "versions">("templates");

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ["all", ...Array.from(cats)];
  }, [templates]);

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.shortcut?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
        const template = templates.find(t => t.shortcut && value.endsWith(t.shortcut));
        
        if (template) {
          e.preventDefault();
          const newValue = value.slice(0, -template.shortcut!.length) + template.content;
          (e.target as HTMLInputElement | HTMLTextAreaElement).value = newValue;
          onSelectTemplate(newValue);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [templates, onSelectTemplate]);

  const handleAddTemplate = async (template: Omit<Template, "id">) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
    };
    setTemplates(prev => [...prev, newTemplate]);
    setIsAddingTemplate(false);

    // Create initial version
    await templateManager.createVersion(
      newTemplate.id,
      newTemplate.content,
      "Current User",
      "Initial version"
    );
  };

  const handleEditTemplate = async (template: Omit<Template, "id">) => {
    if (!editingTemplate) return;
    const updatedTemplate = { ...template, id: editingTemplate.id };
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    setEditingTemplate(null);

    // Create new version
    await templateManager.createVersion(
      updatedTemplate.id,
      updatedTemplate.content,
      "Current User",
      "Updated template content"
    );
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const handleTemplateSelect = async (template: Template) => {
    onSelectTemplate(template.content);
    // Track template usage
    await templateManager.trackTemplateUsage(template.id, 0, true);
  };

  const handleVersionSelect = (content: string) => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, content });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="versions" disabled={!selectedTemplateId}>Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {/* Search and Filters */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Response Template</DialogTitle>
                </DialogHeader>
                <TemplateForm onSubmit={handleAddTemplate} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Templates List */}
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.shortcut && (
                        <code className="px-2 py-1 rounded-md bg-muted text-xs">
                          {template.shortcut}
                        </code>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{template.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(template.id)}
                    >
                      {template.isFavorite ? (
                        <Star className="h-4 w-4 fill-primary" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setSelectedTab("versions");
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setSelectedTab("analytics");
                      }}
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Template</DialogTitle>
                        </DialogHeader>
                        <TemplateForm
                          template={template}
                          onSubmit={handleEditTemplate}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <TemplateAnalytics templateId={selectedTemplateId || undefined} />
        </TabsContent>

        <TabsContent value="versions">
          {selectedTemplateId && (
            <TemplateVersions
              templateId={selectedTemplateId}
              currentContent={templates.find(t => t.id === selectedTemplateId)?.content || ""}
              onVersionSelect={handleVersionSelect}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TemplateFormProps {
  template?: Template;
  onSubmit: (template: Omit<Template, "id">) => void;
}

function TemplateForm({ template, onSubmit }: TemplateFormProps) {
  const [formData, setFormData] = React.useState({
    name: template?.name || "",
    content: template?.content || "",
    shortcut: template?.shortcut || "",
    category: template?.category || "General",
    isFavorite: template?.isFavorite || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <RichTextEditor
          value={formData.content}
          onChange={(value) => setFormData({ ...formData, content: value })}
          placeholder="Enter template content..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shortcut">Keyboard Shortcut</Label>
          <Input
            id="shortcut"
            value={formData.shortcut}
            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
            placeholder="e.g., !greet"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {template ? "Save Changes" : "Add Template"}
      </Button>
    </form>
  );
} 