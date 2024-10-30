import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { 
  Box,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid2,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { Schema } from '../../amplify/data/resource';

interface Website {
  id: string;
  name: string;
  url: string;
  category?: string;
  tags?: string[];
}

interface FormData {
  name: string;
  url: string;
  category: string;
  tags: string;
}

const client = generateClient<Schema>();

function AdminWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    url: '',
    category: '',
    tags: '',
  });

  useEffect(() => {
    fetchWebsites();
  }, []);

  async function fetchWebsites() {
    try {
      const response = await client.models.Website.list();
      setWebsites(response.data.map((website: any) => ({
        ...website,
        category: website.category ?? undefined,
      })));
      setError(null);
    } catch (err) {
      console.error('Error fetching websites:', err);
      setError('Failed to load websites. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDialog(website?: Website) {
    if (website) {
      setEditingWebsite(website);
      setFormData({
        name: website.name,
        url: website.url,
        category: website.category || '',
        tags: website.tags?.join(', ') || '',
      });
    } else {
      setEditingWebsite(null);
      setFormData({
        name: '',
        url: '',
        category: '',
        tags: '',
      });
    }
    setOpenDialog(true);
  }

  async function handleSubmit() {
    try {
      const websiteData = {
        name: formData.name,
        url: formData.url,
        category: formData.category || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
      };

      if (editingWebsite) {
        await client.models.Website.update({
          id: editingWebsite.id,
          ...websiteData,
        });
      } else {
        await client.models.Website.create(websiteData);
      }

      setOpenDialog(false);
      fetchWebsites();
      setError(null);
    } catch (err) {
      console.error('Error saving website:', err);
      setError('Failed to save website. Please try again.');
    }
  }

  async function handleDelete(websiteId: string) {
    if (window.confirm('Are you sure you want to delete this website?')) {
      try {
        await client.models.Website.delete({ id: websiteId });
        fetchWebsites();
        setError(null);
      } catch (err) {
        console.error('Error deleting website:', err);
        setError('Failed to delete website. Please try again.');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1">
          Manage Websites
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
          Add Website
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Grid2 container spacing={3}>
        {websites.map((website) => (
          <Grid2 key={website.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {website.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {website.url}
                </Typography>
                {website.category && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Category: {website.category}
                  </Typography>
                )}
                {website.tags && website.tags.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Tags: {website.tags.join(', ')}
                  </Typography>
                )}
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                <Button
                  component={Link}
                  to={`/admin/editFeeds/${website.id}`}
                  //startIcon={<RssFeedIcon />}
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                >
                  Manage Feeds
                </Button>
                <Box>
                  <IconButton 
                    onClick={() => handleOpenDialog(website)}
                    size="small"
                    sx={{ color: 'primary.main', mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(website.id)}
                    size="small"
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingWebsite ? 'Edit Website' : 'Add New Website'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Website Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Website URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
            />
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
            {editingWebsite ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminWebsites;