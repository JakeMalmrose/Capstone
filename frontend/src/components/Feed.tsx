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
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;

type ArticleResponse = {
  data: {
    listArticles: {
      items: Schema['Article']['type'][];
      nextToken: string | null;
    };
  };
};

function Feed() {
  const { feedId } = useParams<{ feedId: string }>();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Schema['Feed']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allArticles, setAllArticles] = useState<Schema['Article']['type'][]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Schema['Article']['type'][]>([]);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAllArticles = async (feedId: string) => {
    let allItems: Schema['Article']['type'][] = [];
    let nextToken: string | null = null;
    
    do {
      try {
        const response: ArticleResponse = await client.models.Article.list({
          filter: { feedId: { eq: feedId } },
          nextToken: nextToken
        });
        
        allItems = [...allItems, ...response.data.listArticles.items];
        nextToken = response.data.listArticles.nextToken;
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again later.');
        break;
      }
    } while (nextToken);

    return allItems;
  };

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
      
      // Refresh articles after fetching news
      if (feedId) {
        const items = await fetchAllArticles(feedId);
        setAllArticles(items);
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        message: 'Failed to fetch news articles'
      });
    } finally {
      setFetchingNews(false);
    }
  }

  useEffect(() => {
    if (!feedId) return;

    const initialize = async () => {
      try {
        // Fetch feed details
        const feedResponse = await client.models.Feed.get({ id: feedId });
        setFeed(feedResponse.data);

        // Fetch all articles initially
        const items = await fetchAllArticles(feedId);
        setAllArticles(items);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to load feed. Please try again later.');
        setLoading(false);
      }
    };

    initialize();

    // Set up subscription for real-time updates
    const subscription = client.models.Article.observeQuery({
      filter: { feedId: { eq: feedId } }
    }).subscribe({
      next: async ({ items }) => {
        // When we get an update, fetch all articles again to ensure we have complete data
        const allItems = await fetchAllArticles(feedId);
        setAllArticles(allItems);
      },
      error: (err) => {
        console.error('Error observing articles:', err);
        setError('Failed to load articles. Please try again later.');
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