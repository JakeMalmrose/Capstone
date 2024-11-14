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
  Chip,
  IconButton,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Schema } from '../../../amplify/data/resource';

type SpecialRequestPreset = Schema['SpecialRequestPreset']['type'];

const client = generateClient<Schema>();

function AdminSpecialRequestPresets() {
  const [specialRequestPresets, setSpecialRequestPresets] = useState<SpecialRequestPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSpecialRequestPreset, setEditingSpecialRequestPreset] = useState<SpecialRequestPreset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    client.models.SpecialRequestPreset.observeQuery().subscribe({
      next: ({ items }) => {
        setSpecialRequestPresets([...items]);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching presets:', error);
        setError('Failed to load special request presets');
        setLoading(false);
      }
    });
  }, []);

  const handleOpenDialog = (preset?: SpecialRequestPreset) => {
    if (preset) {
      setEditingSpecialRequestPreset(preset);
      setFormData({
        name: preset.name,
        content: preset.content,
        description: preset.description || '',
        isActive: preset.isActive
      });
    } else {
      setEditingSpecialRequestPreset(null);
      setFormData({
        name: '',
        content: '',
        description: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSpecialRequestPreset(null);
    setFormData({
      name: '',
      content: '',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingSpecialRequestPreset) {
        await client.models.SpecialRequestPreset.update({
          id: editingSpecialRequestPreset.id,
          ...formData
        });
      } else {
        await client.models.SpecialRequestPreset.create(formData);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving preset:', err);
      setError('Failed to save special request preset');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.models.SpecialRequestPreset.delete({ id });
    } catch (err) {
      console.error('Error deleting preset:', err);
      setError('Failed to delete special request preset');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Special Request Presets
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            Add New Preset
          </Button>
        </Grid>

        {loading && (
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        )}

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper 
            elevation={3}
            sx={{
              p: 2,
              bgcolor: 'background.default',
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[6],
              }
            }}
          >
            {specialRequestPresets.map((preset) => (
              <Paper
                key={preset.id}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'background.paper',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="h6">{preset.name}</Typography>
                    {preset.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {preset.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleOpenDialog(preset)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(preset.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                  {preset.content}
                </Typography>
                <Chip
                  label={preset.isActive ? 'Active' : 'Inactive'}
                  color={preset.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Paper>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle>
          {editingSpecialRequestPreset ? 'Edit Preset' : 'Add New Preset'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              label="Content"
              fullWidth
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              multiline
              rows={4}
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="primary"
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.content}
          >
            {editingSpecialRequestPreset ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminSpecialRequestPresets;
