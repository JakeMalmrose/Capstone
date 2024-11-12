import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Paper,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface SummaryState {
  text: string;
  loading: boolean;
  error: string | null;
}

function UnreadArticles() {
  const [currentArticle, setCurrentArticle] = useState<Schema['Article']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryState, setSummaryState] = useState<SummaryState>({
    text: '',
    loading: false,
    error: null
  });
  const [showFullText, setShowFullText] = useState(false);
  const [defaultSummarizer, setDefaultSummarizer] = useState<Schema['Summarizer']['type'] | null>(null);
  
  // Load default summarizer first
  useEffect(() => {
    async function loadDefaultSummarizer() {
      try {
        const summarizers = await client.models.Summarizer.list();
        setDefaultSummarizer(summarizers.data[0] || null);
      } catch (err) {
        console.error('Error loading default summarizer:', err);
        setError('Failed to load summarizer. Please try again later.');
      }
    }
    loadDefaultSummarizer();
  }, []);

  const fetchSummary = async (articleId: string, fullText: string, userId: string) => {
    if (!defaultSummarizer) return;

    setSummaryState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Try to fetch existing summary
      const existingSummaries = await client.models.Summary.list({
        filter: {
          articleId: { eq: articleId },
          summarizerId: { eq: defaultSummarizer.id },
          userId: { attributeExists: false }
        }
      });

      if (existingSummaries.data.length > 0) {
        setSummaryState(prev => ({
          ...prev,
          text: existingSummaries.data[0].text,
          loading: false
        }));
        return;
      }

      // If no existing summary, generate new one
      const result = await client.queries.summarize({
        text: fullText,
        articleId: articleId,
        summarizerId: defaultSummarizer.id,
        userId: userId
      });

      setSummaryState(prev => ({
        ...prev,
        text: result.data || '',
        loading: false
      }));
    } catch (err) {
      console.error('Error fetching/generating summary:', err);
      setSummaryState(prev => ({
        ...prev,
        error: 'Failed to generate summary. Please try again.',
        loading: false
      }));
    }
  };
  
  const fetchNextUnreadArticle = async () => {
    if (!defaultSummarizer) return;
    
    setLoading(true);
    try {
      const user = await getCurrentUser();
      
      // Get all articles from subscribed feeds
      const userFeeds = await client.models.UserFeedSubscription.list({
        filter: {
          userId: { eq: user.userId }
        }
      });
      
      const feedIds = userFeeds.data.map(sub => sub.feedId);
      
      // Get all articles from these feeds
      const articles = await client.models.Article.list({
        filter: {
              or: feedIds.map(feedId => ({
                feedId: { eq: feedId }
              }))
        }
      });
      
      // Get user's read status for these articles
      const readStatuses = await client.models.UserArticleStatus.list({
        filter: {
          userId: { eq: user.userId },
          isRead: { eq: true }
            }
      });
      
      const readArticleIds = new Set(readStatuses.data.map(status => status.articleId));
      
      // Find first unread article
      const unreadArticle = articles.data.find(article => !readArticleIds.has(article.id));
      
      if (unreadArticle && unreadArticle.fullText) {
        setCurrentArticle(unreadArticle);
        fetchSummary(unreadArticle.id, unreadArticle.fullText, user.userId);
      } else {
        setCurrentArticle(null);
      }
    } catch (err) {
      console.error('Error fetching unread article:', err);
      setError('Failed to load unread articles. Please try again later.');
    }
    setLoading(false);
  };
  
  const markAsRead = async () => {
    if (!currentArticle) return;
    
    try {
      const user = await getCurrentUser();
      await client.models.UserArticleStatus.create({
        userId: user.userId,
        articleId: currentArticle.id,
        isRead: true,
        readAt: new Date().toISOString(),
      });
      
        fetchNextUnreadArticle();
    } catch (err) {
      console.error('Error marking article as read:', err);
      setError('Failed to mark article as read. Please try again.');
    }
  };

  // Only fetch articles after default summarizer is loaded
  useEffect(() => {
    if (defaultSummarizer) {
      fetchNextUnreadArticle();
    }
  }, [defaultSummarizer]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentArticle) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No unread articles available! Subscribe to more feeds to discover new content.
        </Alert>
      </Box>
    );
  }

  const truncatedText = currentArticle.fullText ? currentArticle.fullText.slice(0, 40) + '...' : "No text available for this article";

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Read Articles
      </Typography>

      <Card 
        sx={{
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) => theme.shadows[4],
          }
        }}
      >
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {currentArticle.title}
          </Typography>

          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Published: {currentArticle.createdAt ? new Date(currentArticle.createdAt).toLocaleDateString() : 'Unknown'}
          </Typography>

          {/* Summary Section */}
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            
            {summaryState.loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography>Generating summary...</Typography>
              </Box>
            ) : summaryState.error ? (
              <Alert severity="error">{summaryState.error}</Alert>
            ) : summaryState.text ? (
              <Paper 
                elevation={1}
                sx={{ 
                  p: 2,
                  bgcolor: 'background.default',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Typography>{summaryState.text}</Typography>
              </Paper>
            ) : null}
          </Box>

          {/* Full Text Section */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(currentArticle.url, '_blank')}
            >
              Read Original
            </Button>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SkipNextIcon />}
              onClick={markAsRead}
            >
              Mark as Read & Next
            </Button>
          </Stack>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Full Article
            </Typography>
            <Typography variant="body1">
              {showFullText ? currentArticle.fullText : truncatedText}
            </Typography>
            <Button
              variant="text"
              onClick={() => setShowFullText(!showFullText)}
              sx={{ mt: 1 }}
            >
              {showFullText ? 'Show Less' : 'Show More'}
            </Button>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
}

export default UnreadArticles;
