import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { 
  Box,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  // Select,
  MenuItem,
  // FormControl,
  // InputLabel,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Schema } from '../../../amplify/data/resource';

type ModelType = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly tags?: string[] | null;
  readonly tier?: "FREE" | "PRO" | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly owner?: string | null;
};

type Summarizer = ModelType;

interface FormData {
  name: string;
  description: string;
  tags: string;
  tier: "FREE" | "PRO";
}

const client = generateClient<Schema>();

function AdminEditSummarizers() {
  const [summarizers, setSummarizers] = useState<Summarizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSummarizer, setEditingSummarizer] = useState<Summarizer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    tags: '',
    tier: 'FREE',
  });

  useEffect(() => {
    fetchSummarizers();
  }, []);

  async function fetchSummarizers() {
    try {
      const response = await client.models.Summarizer.list();
      setSummarizers(response.data as Summarizer[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching summarizers:', err);
      setError('Failed to load summarizers. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDialog(summarizer?: Summarizer) {
    if (summarizer) {
      setEditingSummarizer(summarizer);
      setFormData({
        name: summarizer.name,
        description: summarizer.description || '',
        tags: summarizer.tags?.join(', ') || '',
        tier: summarizer.tier || 'FREE',
      });
    } else {
      setEditingSummarizer(null);
      setFormData({
        name: '',
        description: '',
        tags: '',
        tier: 'FREE',
      });
    }
    setOpenDialog(true);
  }

  async function handleSubmit() {
    try {
      const summarizerData = {
        name: formData.name,
        description: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
        tier: formData.tier,
      };

      if (editingSummarizer) {
        await client.models.Summarizer.update({
          id: editingSummarizer.id,
          ...summarizerData,
        });
      } else {
        await client.models.Summarizer.create(summarizerData);
      }

      setOpenDialog(false);
      fetchSummarizers();
      setError(null);
    } catch (err) {
      console.error('Error saving summarizer:', err);
      setError('Failed to save summarizer. Please try again.');
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this summarizer?')) {
      try {
        await client.models.Summarizer.delete({ id });
        fetchSummarizers();
        setError(null);
      } catch (err) {
        console.error('Error deleting summarizer:', err);
        setError('Failed to delete summarizer. Please try again.');
      }
    }
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h2" component="h1">
          Manage Summarizers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          Add Summarizer
        </Button>
      </Box>

      {summarizers.map((summarizer) => (
        <Paper key={summarizer.id} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6">{summarizer.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {summarizer.description}
              </Typography>
              {summarizer.tags && summarizer.tags.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tags: {summarizer.tags.join(', ')}
                  </Typography>
                </Box>
              )}
              <Chip
                label={summarizer.tier}
                color={summarizer.tier === 'PRO' ? 'secondary' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
            <Box>
              <IconButton 
                onClick={() => handleOpenDialog(summarizer)}
                sx={{ color: 'primary.main' }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                onClick={() => handleDelete(summarizer.id)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      ))}

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSummarizer ? 'Edit Summarizer' : 'Add New Summarizer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Tier"
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as "FREE" | "PRO" })}
              fullWidth
            >
              <MenuItem value="FREE">Free</MenuItem>
              <MenuItem value="PRO">Pro</MenuItem>
            </TextField>
            <TextField
              label="Tags (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              fullWidth
              helperText="Enter tags separated by commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSummarizer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminEditSummarizers;