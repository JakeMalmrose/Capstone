import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useParams, Link } from 'react-router-dom';
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
  Grid2,
  CardContent,
  CardActions,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import type { Schema } from '../../../amplify/data/resource';

type ModelType = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly description?: string | null;
  readonly type?: "RSS" | "OTHER" | null;
  readonly tags?: string[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly websiteId: string;
  readonly owner?: string | null;
};

type Feed = ModelType;

interface FormData {
  name: string;
  url: string;
  description: string;
  type: 'GNEWS' | 'RSS' | 'OTHER';
  tags: string;
}

interface Website {
  id: string;
  name: string;
  url: string;
}

const client = generateClient<Schema>();

function AdminEditFeeds() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
  const [formData, setFormData] = useState<FormData>({
      name: '',
      url: '',
      description: '',
      type: 'OTHER',
      tags: '',
  });

  useEffect(() => {
    if (websiteId) {
      fetchWebsiteAndFeeds();
    }
  }, [websiteId]);

  async function fetchWebsiteAndFeeds() {
    try {
      const websiteResponse = await client.models.Website.get({
        id: websiteId!,
      });
      setWebsite(websiteResponse.data);

      const feedsResponse = await client.models.Feed.list({
        filter: {
          websiteId: {
            eq: websiteId
          }
        }
      });
      setFeeds(feedsResponse.data as Feed[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load website data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDialog(feed?: Feed) {
    if (feed) {
      setEditingFeed(feed);
      setFormData({
        name: feed.name,
        url: feed.url,
        description: feed.description || '',
        type: feed.type ?? 'OTHER',
        tags: feed.tags?.join(', ') || '',
      });
    } else {
      setEditingFeed(null);
      setFormData({
        name: '',
        url: '',
        description: '',
        type: 'RSS',
        tags: '',
      });
    }
    setOpenDialog(true);
  }

  async function handleSubmit() {
    try {
      const feedData = {
        name: formData.name,
        url: formData.url,
        description: formData.description || undefined,
        type: formData.type,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
        websiteId: websiteId!,
      };

      if (editingFeed) {
        await client.models.Feed.update({
          id: editingFeed.id,
          ...feedData,
        });
      } else {
        await client.models.Feed.create(feedData);
      }

      setOpenDialog(false);
      fetchWebsiteAndFeeds();
      setError(null);
    } catch (err) {
      console.error('Error saving feed:', err);
      setError('Failed to save feed. Please try again.');
    }
  }

  async function handleDelete(feedId: string) {
    if (window.confirm('Are you sure you want to delete this feed?')) {
      try {
        await client.models.Feed.delete({ id: feedId });
        fetchWebsiteAndFeeds();
        setError(null);
      } catch (err) {
        console.error('Error deleting feed:', err);
        setError('Failed to delete feed. Please try again.');
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          component={Link}
          to="/admin/websites"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h2" component="h1">
          Manage Feeds: {website?.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 0 }}>
          Feeds
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
          Add Feed
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid2 container spacing={3}>
        {feeds.map((feed) => (
          <Grid2 key={feed.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {feed.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {feed.url}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type: {feed.type}
                </Typography>
                {feed.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {feed.description}
                  </Typography>
                )}
                {feed.tags && feed.tags.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Tags: {feed.tags.join(', ')}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton 
                  onClick={() => handleOpenDialog(feed)}
                  size="small"
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleDelete(feed.id)}
                  size="small"
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
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
          {editingFeed ? 'Edit Feed' : 'Add New Feed'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Feed Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Feed URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              fullWidth
            />
            <TextField
              select
              label="Feed Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RSS' | 'OTHER' })}
              fullWidth
            >
              <MenuItem value="RSS">RSS</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
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
            {editingFeed ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminEditFeeds;