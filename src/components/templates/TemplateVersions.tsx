import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { templateManager, type TemplateVersion } from "@/lib/api/templates";
import { History, ArrowLeft, ArrowRight } from "lucide-react";

interface TemplateVersionsProps {
  templateId: string;
  currentContent: string;
  onVersionSelect: (content: string) => void;
}

export function TemplateVersions({ templateId, currentContent, onVersionSelect }: TemplateVersionsProps) {
  const [versions, setVersions] = React.useState<TemplateVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = React.useState<TemplateVersion | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = React.useState(false);
  const [changeDescription, setChangeDescription] = React.useState("");

  React.useEffect(() => {
    const loadVersions = async () => {
      try {
        const data = await templateManager.getVersionHistory(templateId);
        setVersions(data);
      } catch (error) {
        console.error('Failed to load version history:', error);
      }
    };

    loadVersions();
  }, [templateId]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const version = await templateManager.createVersion(
        templateId,
        currentContent,
        "Current User", // TODO: Replace with actual user
        changeDescription
      );
      setVersions(prev => [...prev, version]);
      setIsCreatingVersion(false);
      setChangeDescription("");
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const handleVersionSelect = (version: TemplateVersion) => {
    setSelectedVersion(version);
    onVersionSelect(version.content);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Version History</h3>
        <Dialog open={isCreatingVersion} onOpenChange={setIsCreatingVersion}>
          <DialogTrigger asChild>
            <Button>
              <History className="h-4 w-4 mr-2" />
              Save Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save New Version</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Change Description</Label>
                <Input
                  id="description"
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="Describe the changes made in this version..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">Save Version</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {versions.map((version, index) => (
          <Card
            key={version.id}
            className={`cursor-pointer transition-colors ${
              selectedVersion?.id === version.id ? 'border-primary' : ''
            }`}
            onClick={() => handleVersionSelect(version)}
          >
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Version {versions.length - index}</CardTitle>
                  <CardDescription>{new Date(version.createdAt).toLocaleString()}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {index < versions.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVersionSelect(versions[index + 1]);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVersionSelect(versions[index - 1]);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-sm text-muted-foreground">{version.changeDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">Created by {version.createdBy}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 