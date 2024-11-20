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

interface AppState {
  summarizer: Schema['Summarizer']['type'] | null;
  userPreferences: Schema['UserPreferences']['type'] | null;
}

function UnreadArticles() {
  // Core state
  const [appState, setAppState] = useState<AppState>({
    summarizer: null,
    userPreferences: null
  });
  const [currentArticle, setCurrentArticle] = useState<Schema['Article']['type'] | null>(null);
  const [currentSummary, setCurrentSummary] = useState<SummaryState>({
    text: '',
    loading: false,
    error: null
  });
  const [unreadArticles, setUnreadArticles] = useState<Schema['UnreadArticle']['type'][]>([]);
  
  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Load initial app state and set up observe query
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    async function initialize() {
      try {
        setPageLoading(true);
        const user = await getCurrentUser();

        // Load user preferences and summarizers in parallel
        const [preferencesResponse, summarizersResponse] = await Promise.all([
          client.models.UserPreferences.list({
            filter: { userId: { eq: user.userId } }
          }),
          client.models.Summarizer.list()
        ]);

        const userPreferences = preferencesResponse.data[0] || null;
        const selectedSummarizer = summarizersResponse.data.find(s => s.id === userPreferences?.defaultSummarizerId) 
          || summarizersResponse.data[0] || null;

        setAppState({
          summarizer: selectedSummarizer,
          userPreferences
        });

        // Set up observe query for unread articles
        subscription = client.models.UnreadArticle.observeQuery({
          filter: { userId: { eq: user.userId } }
        }).subscribe({
          next: ({ items }) => {
            const sortedItems = [...items].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setUnreadArticles(sortedItems);
            
            // Set first article if we don't have one yet
            if (!currentArticle && sortedItems.length > 0) {
              loadFullArticle(sortedItems[0].articleId);
            }
            
            setPageLoading(false);
          },
          error: (err) => {
            console.error('Error observing unread articles:', err);
            setError('Failed to load articles. Please try again later.');
            setPageLoading(false);
          }
        });

      } catch (err) {
        console.error('Error initializing app:', err);
        setError('Failed to initialize application. Please try again later.');
        setPageLoading(false);
      }
    }

    initialize();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Helper function to load full article details
  async function loadFullArticle(articleId: string) {
    try {
      const articleResponse = await client.models.Article.get({ id: articleId });
      
      if (articleResponse.errors || !articleResponse.data) {
        throw new Error('Error fetching article details');
      }

      setCurrentArticle(articleResponse.data);
    } catch (err) {
      console.error('Error loading full article:', err);
      setError('Failed to load article details. Please try again.');
    }
  }

  // Load summary after article is set
  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      if (!currentArticle?.fullText || !appState.summarizer) {
        setCurrentSummary({
          text: '',
          loading: false,
          error: null
        });
        return;
      }

      try {
        setCurrentSummary(prev => ({ ...prev, loading: true, error: null }));
        
        // Check for existing summary
        const summariesResponse = await client.models.Summary.list({
          filter: {
            articleId: { eq: currentArticle.id },
            summarizerId: { eq: appState.summarizer.id },
            specialRequests: appState.userPreferences?.specialRequests ? { eq: appState.userPreferences.specialRequests } : undefined
          }
        });

        if (!isMounted) return;

        if (summariesResponse.errors) {
          throw new Error(`Error fetching summaries: ${JSON.stringify(summariesResponse.errors)}`);
        }

        if (summariesResponse.data.length > 0) {
          //foreach here
          setCurrentSummary({
            text: summariesResponse.data[0].text,
            loading: false,
            error: null
          });
          return;
        }

        // Generate new summary if none exists
        const result = await client.queries.summarize({
          text: currentArticle.fullText,
          articleId: currentArticle.id,
          summarizerId: appState.summarizer.id,
          specialRequests: appState.userPreferences?.specialRequests,
        });

        if (!isMounted) return;

        if (!result.data) {
          throw new Error('Summary generation returned no data');
        }

        setCurrentSummary({
          text: result.data,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Error loading summary:', err);
        if (isMounted) {
          setCurrentSummary(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load summary. Please try again.'
          }));
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [currentArticle?.id, appState.summarizer?.id, appState.userPreferences?.specialRequests]);

  // Mark article as read and load next
  const markAsRead = async () => {
    if (!currentArticle) return;
    
    try {
      const user = await getCurrentUser();
      
      // Find the current unread article entry
      const currentUnreadEntry = unreadArticles.find(ua => ua.articleId === currentArticle.id);
      
      if (currentUnreadEntry?.id) {
        // Delete from unread articles
        await client.models.UnreadArticle.delete({
          id: currentUnreadEntry.id
        });
      }
      
      // Mark as read
      await client.models.UserArticleStatus.create({
        userId: user.userId,
        articleId: currentArticle.id,
        isRead: true,
        readAt: new Date().toISOString(),
      });
      
      // Load next article if available
      const currentIndex = unreadArticles.findIndex(ua => ua.articleId === currentArticle.id);
      if (currentIndex > -1 && currentIndex < unreadArticles.length - 1) {
        loadFullArticle(unreadArticles[currentIndex + 1].articleId);
      } else {
        setCurrentArticle(null);
      }
      
      setCurrentSummary({ text: '', loading: false, error: null });
      
    } catch (err) {
      console.error('Error marking article as read:', err);
      setError('Failed to mark article as read. Please try again.');
    }
  };

  if (pageLoading) {
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

      <Card>
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
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
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