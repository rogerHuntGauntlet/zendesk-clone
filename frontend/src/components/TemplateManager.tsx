"use client";

import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Paper,
  Tab,
  SelectChangeEvent
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  Edit as EditIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { templateManager, ResponseTemplate, TemplateUsageStats } from '../lib/template-manager';
import { SharedTemplates } from './templates/SharedTemplates';
import type { Employee } from '@/types';

interface TemplateFormData {
  name: string;
  category: string;
  content: string;
  tags: string[];
}

interface TemplateManagerProps {
  onSelectTemplate?: (content: string) => void;
  showAnalytics?: boolean;
  currentUser: Employee;
  isReviewer?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSelectTemplate,
  showAnalytics = true,
  currentUser,
  isReviewer = false
}) => {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [templateStats, setTemplateStats] = useState<TemplateUsageStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: '',
    content: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [filter, setFilter] = useState({ category: '', search: '' });
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const loadedTemplates = await templateManager.getTemplates();
    setTemplates(loadedTemplates);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setFormData({ name: '', category: '', content: '', tags: [] });
    setIsEditing(true);
  };

  const handleEdit = (template: ResponseTemplate) => {
    const currentVersion = template.versions.find(v => v.id === template.currentVersion);
    if (!currentVersion) return;

    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: currentVersion.content,
      tags: template.tags
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (selectedTemplate) {
        await templateManager.updateTemplate(selectedTemplate.id, {
          content: formData.content,
          createdBy: 'current-user', // Replace with actual user ID
          comment: 'Updated template' // Optional comment
        });
      } else {
        await templateManager.createTemplate({
          ...formData,
          createdBy: 'current-user' // Replace with actual user ID
        });
      }
      await loadTemplates();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      // Handle error (show notification, etc.)
    }
  };

  const handleViewHistory = (template: ResponseTemplate) => {
    setSelectedTemplate(template);
    setShowHistory(true);
  };

  const handleRevertVersion = async (versionId: string) => {
    if (!selectedTemplate) return;
    try {
      await templateManager.revertToVersion(selectedTemplate.id, versionId);
      await loadTemplates();
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to revert version:', error);
      // Handle error
    }
  };

  const handleViewStats = async (template: ResponseTemplate) => {
    setSelectedTemplate(template);
    const stats = await templateManager.getUsageStats();
    setTemplateStats(stats[template.id] || null);
    setShowStats(true);
  };

  const handleUseTemplate = (template: ResponseTemplate) => {
    const currentVersion = template.versions.find(v => v.id === template.currentVersion);
    if (currentVersion && onSelectTemplate) {
      onSelectTemplate(currentVersion.content);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = !filter.category || template.category === filter.category;
    const matchesSearch = !filter.search || 
      template.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(filter.search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <Box>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={(_: React.SyntheticEvent, newValue: string) => setActiveTab(newValue)}>
            <Tab label="Personal" value="personal" />
            <Tab label="Shared" value="shared" />
          </TabList>
        </Box>

        <TabPanel value="personal">
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filter.category}
                  onChange={(e: SelectChangeEvent<string>) => 
                    setFilter({ ...filter, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Search templates"
                value={filter.search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setFilter({ ...filter, search: e.target.value })}
              />
            </Grid>
          </Grid>

          <List>
            {filteredTemplates.map(template => (
              <Paper key={template.id} elevation={1} sx={{ mb: 1 }}>
                <ListItem>
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.category}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {template.tags.map(tag => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Use Template">
                      <IconButton
                        edge="end"
                        onClick={() => handleUseTemplate(template)}
                        sx={{ mr: 1 }}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        edge="end"
                        onClick={() => handleEdit(template)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="History">
                      <IconButton
                        edge="end"
                        onClick={() => handleViewHistory(template)}
                        sx={{ mr: 1 }}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    {showAnalytics && (
                      <Tooltip title="Statistics">
                        <IconButton
                          edge="end"
                          onClick={() => handleViewStats(template)}
                        >
                          <StatsIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>

          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateNew}
            sx={{ mt: 2 }}
          >
            Create New Template
          </Button>
        </TabPanel>

        <TabPanel value="shared">
          <SharedTemplates
            currentUser={currentUser}
            isReviewer={isReviewer}
          />
        </TabPanel>
      </TabContext>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setFormData({ ...formData, category: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Content"
            value={formData.content}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setFormData({ ...formData, content: e.target.value })}
            multiline
            rows={4}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Tags</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => setFormData({
                    ...formData,
                    tags: formData.tags.filter(t => t !== tag)
                  })}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                size="small"
                label="New Tag"
                value={newTag}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  if (newTag && !formData.tags.includes(newTag)) {
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, newTag]
                    });
                    setNewTag('');
                  }
                }}
              >
                Add Tag
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Version History</DialogTitle>
        <DialogContent>
          {selectedTemplate?.versions.map(version => (
            <Box key={version.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                Version from {new Date(version.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created by: {version.createdBy}
              </Typography>
              {version.comment && (
                <Typography variant="body2" color="text.secondary">
                  Comment: {version.comment}
                </Typography>
              )}
              <TextField
                fullWidth
                multiline
                rows={2}
                value={version.content}
                InputProps={{ readOnly: true }}
                sx={{ mt: 1 }}
              />
              {version.id !== selectedTemplate.currentVersion && (
                <Button
                  size="small"
                  onClick={() => handleRevertVersion(version.id)}
                  sx={{ mt: 1 }}
                >
                  Revert to this version
                </Button>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Stats Dialog */}
      {showAnalytics && (
        <Dialog open={showStats} onClose={() => setShowStats(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Template Statistics</DialogTitle>
          <DialogContent>
            {selectedTemplate && templateStats && (
              <Box>
                <Typography variant="h6">Usage Statistics</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Uses"
                      secondary={templateStats.usageCount}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Used"
                      secondary={templateStats.lastUsed ? 
                        new Date(templateStats.lastUsed).toLocaleString() :
                        'Never'
                      }
                    />
                  </ListItem>
                  {/* Add more statistics as needed */}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowStats(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}; 