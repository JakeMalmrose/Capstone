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
  Pagination,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Newspaper as NewsIcon,
} from '@mui/icons-material';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Pagination options
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;

function Feed() {
  const { feedId } = useParams<{ feedId: string }>();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Schema['Feed']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allArticles, setAllArticles] = useState<Schema['Article']['type'][]>([]); // Store all articles
  const [displayedArticles, setDisplayedArticles] = useState<Schema['Article']['type'][]>([]); // Store current page articles
  const [fetchingNews, setFetchingNews] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    const newItemsPerPage = event.target.value as number;
    setItemsPerPage(newItemsPerPage);
    setPage(1); // Reset to first page when changing items per page
  };

  // Update displayed articles when page, itemsPerPage, or allArticles changes
  useEffect(() => {
    const sortedArticles = [...allArticles].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedArticles(sortedArticles.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(sortedArticles.length / itemsPerPage));
  }, [page, itemsPerPage, allArticles]);

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
    } catch (err) {
      setActionMessage({
        type: 'error',
        message: 'Failed to fetch news articles'
      });
    } finally {
      setFetchingNews(false);
    }
  }

  const processRssFeed = async () => {
    // Empty method for Get Older Articles functionality
  }

  useEffect(() => {
    if (!feedId) return;

    const fetchFeed = async () => {
      try {
        const feedResponse = await client.models.Feed.get({ id: feedId });
        setFeed(feedResponse.data);
      } catch (err) {
        console.error('Error fetching feed:', err);
        setError('Failed to load feed. Please try again later.');
      }
    };

    fetchFeed();

    const subscription = client.models.Article.observeQuery({
      filter: { feedId: { eq: feedId } }
    }).subscribe({
      next: ({ items }) => {
        setAllArticles(items);
        setLoading(false);
      },
      error: (err) => {
        console.error('Error observing articles:', err);
        setError('Failed to load articles. Please try again later.');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
          <Typography variant="subtitle1" color="text.secondary">
            ({allArticles.length} total articles)
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
            onClick={processRssFeed}
            disabled={fetchingNews}
            startIcon={<NewsIcon />}
          >
            {fetchingNews ? 'Fetching...' : 'Get Older Articles'}
          </Button>

          <Button
            variant="contained"
            onClick={fetchGNews}
            disabled={fetchingNews}
            startIcon={<NewsIcon />}
          >
            {fetchingNews ? 'Fetching...' : 'Get new articles'}
          </Button>

          <Tooltip title="Refresh Articles">
            <IconButton 
              onClick={() => setLoading(true)}
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

      {/* Pagination Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center"
          justifyContent="space-between"
        >
          <FormControl size="small">
            <Select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              displayEmpty
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option} per page
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Pagination 
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />

          <Typography variant="body2" color="text.secondary">
            Showing {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, allArticles.length)} of {allArticles.length}
          </Typography>
        </Stack>
      </Paper>

      {/* Articles Section */}
      {(fetchingNews) && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      <Stack spacing={2}>
        {displayedArticles.map((article) => (
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
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1 }}
              >
                {article.createdAt ? new Date(article.createdAt).toLocaleString() : 'Unknown date'}
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

        {displayedArticles.length === 0 && (
          <Alert severity="info">
            No articles found. Try fetching news.
          </Alert>
        )}
      </Stack>

      {/* Bottom Pagination */}
      {displayedArticles.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}

export default Feed;