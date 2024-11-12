import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Link } from 'react-router-dom';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Grid2,
  Button,
} from '@mui/material';
import type { Schema } from '../../../amplify/data/resource';

interface AdminStats {
  totalWebsites: number;
  totalFeeds: number;
  totalArticles: number;
  activeUsers: number;
}

interface ErrorState {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

const client = generateClient<Schema>();

function StatCard({ title, value, description }: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card 
      sx={{ 
        height: '100%',
        backgroundColor: 'background.paper',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
    >
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" component="p" sx={{ my: 2 }}>
          {value.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function AdminPortal() {
  const [stats, setStats] = useState<AdminStats>({
    totalWebsites: 0,
    totalFeeds: 0,
    totalArticles: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [fetchingNews, setFetchingNews] = useState(false);

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        const websites = await client.models.Website.list();
        const feeds = await client.models.Feed.list();
        const articles = await client.models.Article.list();
        const userPrefs = await client.models.UserPreferences.list();

        setStats({
          totalWebsites: websites.data.length,
          totalFeeds: feeds.data.length,
          totalArticles: articles.data.length,
          activeUsers: userPrefs.data.length,
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError({
          message: 'Failed to load admin statistics. Please try again later.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAdminStats();
  }, []);

  const handleFetchAllNews = async () => {
    setFetchingNews(true);
    setError(null);
    try {
      await client.mutations.fetchAllGNews();
      setError({
        message: 'Successfully triggered news fetch for all sources',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error triggering news fetch:', err);
      setError({
        message: 'Failed to trigger news fetch. Please try again later.',
        severity: 'error'
      });
    } finally {
      setFetchingNews(false);
    }
  };

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
        <Alert severity={error.severity} sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1">
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to="/admin/websites"
            variant="contained"
            sx={{ 
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Manage Websites
          </Button>
          <Button
            component={Link}
            to="/admin/allFeeds"
            variant="contained"
            sx={{ 
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Manage Feeds
          </Button>
          <Button
            component={Link}
            to="/admin/editSummarizers"
            variant="contained"
            sx={{ 
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Manage Summarizers
          </Button>
          <Button
            onClick={handleFetchAllNews}
            disabled={fetchingNews}
            variant="contained"
            sx={{ 
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            {fetchingNews ? 'Fetching News...' : 'Fetch All News'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          System Statistics
        </Typography>

        <Grid2 container spacing={3}>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Websites"
              value={stats.totalWebsites}
              description="Number of websites being tracked"
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Feeds"
              value={stats.totalFeeds}
              description="Total number of RSS and news feeds"
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Articles"
              value={stats.totalArticles}
              description="Total articles processed"
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              description="Users with saved preferences"
            />
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
}

export default AdminPortal;
