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
import FeedbackForm from './FeedbackForm';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface SummaryState {
  text: string;
  loading: boolean;
  error: string | null;
}

interface ArticleWithSummary {
  article: Schema['Article']['type'];
  summary: SummaryState;
}

interface AppState {
  summarizer: Schema['Summarizer']['type'] | null;
  isInitialized: boolean;
}

function UnreadArticles() {
  // Core state
  const [appState, setAppState] = useState<AppState>({
    summarizer: null,
    isInitialized: false
  });
  const [currentArticle, setCurrentArticle] = useState<Schema['Article']['type'] | null>(null);
  const [currentSummary, setCurrentSummary] = useState<SummaryState>({
    text: '',
    loading: false,
    error: null
  });
  const [nextArticleData, setNextArticleData] = useState<ArticleWithSummary | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Helper function to fetch unread articles
  async function fetchUnreadArticles(userId: string, limit: number = 10) {
    try {
      // Pass an object with userId property
      const unreadResponse = await client.models.UnreadArticle.listUnreadByUser({
        userId: userId
      });
  
      if (unreadResponse.errors) {
        throw new Error(`Error fetching unread articles: ${JSON.stringify(unreadResponse.errors)}`);
      }
  
      // Fetch full article data for each unread article
      const articlePromises = unreadResponse.data.map(unread => 
        client.models.Article.get({ id: unread.articleId })
      );
  
      const articleResults = await Promise.all(articlePromises);
      const articles = articleResults
        .filter(result => result.data && !result.errors)
        .map(result => result.data!)
        .slice(0, limit); // Apply limit after fetching
  
      return articles;
    } catch (error) {
      console.error('Error in fetchUnreadArticles:', error);
      throw error;
    }
  }

  // Initialize app - load user preferences and summarizer
  useEffect(() => {
    async function initialize() {
      if (appState.isInitialized) return;
      
      try {
        setLoading(true);
        const user = await getCurrentUser();

        // Load user preferences and summarizers in parallel
        const [preferencesResponse, summarizersResponse] = await Promise.all([
          client.models.UserPreferences.list({
            filter: { userId: { eq: user.userId } }
          }),
          client.models.Summarizer.list(),
        ]);

        const userPreference = preferencesResponse.data[0]?.defaultSummarizerId;
        const selectedSummarizer = summarizersResponse.data.find(s => s.id === userPreference) 
          || summarizersResponse.data[0] || null;

        setAppState({
          summarizer: selectedSummarizer,
          isInitialized: true
        });

        // Fetch first unread article
        const unreadArticles = await fetchUnreadArticles(user.userId, 1);
        if (unreadArticles.length > 0) {
          setCurrentArticle(unreadArticles[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError('Failed to initialize application. Please try again later.');
        setLoading(false);
      }
    }

    initialize();
  }, [appState.isInitialized]);

  // Fetch summary function
  const fetchSummary = async (articleId: string, fullText: string, userId: string) => {
    if (!appState.summarizer) return null;

    try {
      const userPreferences = await client.models.UserPreferences.list({
        filter: { userId: { eq: userId } }
      });

      const specialRequests = userPreferences.data[0]?.specialRequests;

      const existingSummaries = await client.models.Summary.list({
        filter: {
          articleId: { eq: articleId },
          summarizerId: { eq: appState.summarizer.id },
          ...(specialRequests ? { specialRequests: { eq: specialRequests } } : { specialRequests: { attributeExists: false } })
        }
      });

      if (existingSummaries.data.length > 0) {
        return {
          text: existingSummaries.data[0].text,
          loading: false,
          error: null
        };
      }

      const result = await client.queries.summarize({
        text: fullText,
        articleId: articleId,
        summarizerId: appState.summarizer.id,
        specialRequests: specialRequests
      });

      return {
        text: result.data || '',
        loading: false,
        error: null
      };
    } catch (err) {
      console.error('Error fetching/generating summary:', err);
      return {
        text: '',
        loading: false,
        error: 'Failed to generate summary. Please try again.'
      };
    }
  };

  // Load current article's summary
  useEffect(() => {
    async function loadCurrentSummary() {
      if (!currentArticle?.fullText || !appState.summarizer || !appState.isInitialized) return;

      setCurrentSummary(prev => ({ ...prev, loading: true }));
      try {
        const user = await getCurrentUser();
        const summary = await fetchSummary(currentArticle.id, currentArticle.fullText, user.userId);
        if (summary) {
          setCurrentSummary(summary);
        }
      } catch (err) {
        console.error('Error loading summary:', err);
        setCurrentSummary(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load summary'
        }));
      }
    }

    loadCurrentSummary();
  }, [currentArticle?.id, appState.summarizer?.id, appState.isInitialized]);

  // Fetch next unread article
  const fetchNextUnreadArticle = async (): Promise<Schema['Article']['type'] | null> => {
    try {
      const user = await getCurrentUser();
      const unreadArticles = await fetchUnreadArticles(user.userId, 1);
      return unreadArticles[0] || null;
    } catch (err) {
      console.error('Error fetching unread article:', err);
      throw new Error('Failed to load unread articles');
    }
  };

  // Prefetch next article
  useEffect(() => {
    async function prefetchNextArticle() {
      if (!currentArticle || !appState.summarizer || !appState.isInitialized) return;

      try {
        const nextArticle = await fetchNextUnreadArticle();
        if (nextArticle?.fullText) {
          const user = await getCurrentUser();
          const summary = await fetchSummary(nextArticle.id, nextArticle.fullText, user.userId);
          setNextArticleData({
            article: nextArticle,
            summary: summary || { text: '', loading: false, error: null }
          });
        } else {
          setNextArticleData(null);
        }
      } catch (err) {
        console.error('Error prefetching next article:', err);
      }
    }

    prefetchNextArticle();
  }, [currentArticle?.id, appState.summarizer?.id, appState.isInitialized]);

  // Mark article as read
  const markAsRead = async () => {
    if (!currentArticle) return;
    
    try {
      const user = await getCurrentUser();
      
      // Find the UnreadArticle entry first
      const unreadResponse = await client.models.UnreadArticle.list({
        filter: {
          userId: { eq: user.userId },
          articleId: { eq: currentArticle.id }
        }
      });
  
      if (unreadResponse.data[0]?.id) {
        // Delete using the entry's ID
        await client.models.UnreadArticle.delete({
          id: unreadResponse.data[0].id
        });
      }
      
      // Create UserArticleStatus as before
      await client.models.UserArticleStatus.create({
        userId: user.userId,
        articleId: currentArticle.id,
        isRead: true,
        readAt: new Date().toISOString(),
      });
      
      // Rest of the function remains the same...
      if (nextArticleData) {
        setCurrentArticle(nextArticleData.article);
        setCurrentSummary(nextArticleData.summary);
        setNextArticleData(null);
      } else {
        const nextArticle = await fetchNextUnreadArticle();
        if (nextArticle) {
          setCurrentArticle(nextArticle);
          setCurrentSummary({ text: '', loading: true, error: null });
        } else {
          setCurrentArticle(null);
          setCurrentSummary({ text: '', loading: false, error: null });
        }
      }
    } catch (err) {
      console.error('Error marking article as read:', err);
      setError('Failed to mark article as read. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // No articles state
  if (!currentArticle) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          You've read all your news for now! Subscribe to more feeds to discover new content.
        </Alert>
      </Box>
    );
  }

  const truncatedText = currentArticle.fullText 
    ? currentArticle.fullText.slice(0, 40) + '...' 
    : "No text available for this article";

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              {currentArticle.title}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setShowFeedbackForm(true)}
              sx={{ ml: 2 }}
            >
              Submit Feedback
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Published: {currentArticle.createdAt ? new Date(currentArticle.createdAt).toLocaleDateString() : 'Unknown'}
          </Typography>

          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            
            {currentSummary.loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography>Generating summary...</Typography>
              </Box>
            ) : currentSummary.error ? (
              <Alert severity="error">{currentSummary.error}</Alert>
            ) : currentSummary.text ? (
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
                <Typography>{currentSummary.text}</Typography>
              </Paper>
            ) : null}
          </Box>

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

      <FeedbackForm
        open={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        article={{
          id: currentArticle.id,
          title: currentArticle.title,
          url: currentArticle.url
        }}
      />
    </Box>
  );
}

export default UnreadArticles;