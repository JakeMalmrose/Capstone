import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Newspaper as NewsIcon,
} from '@mui/icons-material';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Define interfaces for the data structures
interface FeedData {
  name: string;
  url: string;
  description: string;
  type: string;
  websiteId: string;
}

interface ArticleData {
  url: string;
  title: string;
  fullText: string;
  createdAt: string;
}

function Feed() {
  const { feedId } = useParams<{ feedId: string }>();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Schema['Feed']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Schema['Article']['type'][]>([]);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const fetchGNews = async () => {
    if (!feedId || !feed) return;
    setFetchingNews(true);
    setActionMessage(null);
    
    try {
      await client.mutations.fetchGNews({ 
        feedId: feedId, 
        websiteId: feed.websiteId 
      });
      setActionMessage({
        type: 'success',
        message: 'Successfully fetched news articles'
      });
      await fetchFeedArticles();
    } catch (err) {
      setActionMessage({
        type: 'error',
        message: 'Failed to fetch news articles'
      });
    } finally {
      setFetchingNews(false);
    }
  }

  const fetchFeedArticles = async () => {
    if (!feedId) return;
    setLoading(true);
    
    try {
      const feedResponse = await client.models.Feed.get({ id: feedId });
      setFeed(feedResponse.data);

      const articlesResponse = await client.models.Article.list({
        filter: { feedId: { eq: feedId } }
      });
      setArticles(articlesResponse.data);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed and articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feedId) return;
    fetchFeedArticles();
  }, [feedId]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!feed) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        >
          Feed not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h2">
            {feed.name} Articles
          </Typography>
        </Stack>

        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 2, wordBreak: 'break-word' }}
        >
          {feed.url}
        </Typography>

        {feed.tags && feed.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {feed.tags.map((tag) => (
              <Chip 
                key={tag}
                label={tag}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(224, 194, 255, 0.08)',
                }}
              />
            ))}
          </Box>
        )}

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={fetchGNews}
            disabled={fetchingNews}
            startIcon={<NewsIcon />}
          >
            {fetchingNews ? 'Fetching...' : 'Fetch GNews'}
          </Button>

          <Tooltip title="Refresh Articles">
            <IconButton 
              onClick={() => fetchFeedArticles()}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {actionMessage && (
          <Alert 
            severity={actionMessage.type} 
            sx={{ mt: 2 }}
            onClose={() => setActionMessage(null)}
          >
            {actionMessage.message}
          </Alert>
        )}
      </Paper>

      {/* Articles Section */}
      {(fetchingNews) && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      <Stack spacing={2}>
        {articles.map((article) => (
          <Card 
            key={article.id}
            sx={{
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.shadows[4],
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                {article.title}
              </Typography>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1.5, wordBreak: 'break-word' }}
              >
                {article.url}
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {article.fullText}
              </Typography>
            </CardContent>

            <CardActions>
              <Button
                component={RouterLink}
                to={`/article/${article.id}`}
                variant="outlined"
                size="small"
              >
                View Full Article
              </Button>
            </CardActions>
          </Card>
        ))}

        {articles.length === 0 && (
          <Alert severity="info">
            No articles found. Try fetching news.
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

export default Feed;
