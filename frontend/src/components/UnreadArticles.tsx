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
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Initialize app - load user preferences and summarizer
  useEffect(() => {
    async function initialize() {
      if (appState.isInitialized) return;
      
      try {
        setLoading(true);
        const user = await getCurrentUser();

        // Load user preferences, summarizers, and read article IDs in parallel
        const [preferencesResponse, summarizersResponse, readIds] = await Promise.all([
          client.models.UserPreferences.list({
            filter: { userId: { eq: user.userId } }
          }),
          client.models.Summarizer.list(),
          fetchAllReadArticleIds(user.userId)
        ]);

        setReadArticleIds(readIds);

        const userPreference = preferencesResponse.data[0]?.defaultSummarizerId;
        const selectedSummarizer = summarizersResponse.data.find(s => s.id === userPreference) 
          || summarizersResponse.data[0] || null;

        setAppState({
          summarizer: selectedSummarizer,
          isInitialized: true
        });

        const userFeeds = await client.models.UserFeedSubscription.list({
          filter: { userId: { eq: user.userId } }
        });
        
        const feedIds = userFeeds.data.map(sub => sub.feedId);
        
        if (feedIds.length > 0) {
          const unreadArticles = await fetchUnreadArticles(feedIds, readIds, 1);
          if (unreadArticles.length > 0) {
            setCurrentArticle(unreadArticles[0]);
          }
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

  const fetchNextUnreadArticle = async (excludeArticleId?: string): Promise<Schema['Article']['type'] | null> => {
    try {
      const user = await getCurrentUser();
      
      const userFeeds = await client.models.UserFeedSubscription.list({
        filter: {
          userId: { eq: user.userId }
        }
      });
      
      const feedIds = userFeeds.data.map(sub => sub.feedId);
      
      if (feedIds.length === 0) {
        return null;
      }

      const currentReadIds = new Set(readArticleIds);
      if (excludeArticleId) {
        currentReadIds.add(excludeArticleId);
      }

      const unreadArticles = await fetchUnreadArticles(feedIds, currentReadIds, 1);
      return unreadArticles[0] || null;
    } catch (err) {
      console.error('Error fetching unread article:', err);
      throw new Error('Failed to load unread articles');
    }
  };

  async function fetchAllReadArticleIds(userId: string): Promise<Set<string>> {
    const readArticleIds = new Set<string>();
    let nextToken: string | undefined;
    
    do {
      const readStatuses = await client.models.UserArticleStatus.list({
        filter: {
          userId: { eq: userId },
          isRead: { eq: true }
        },
        nextToken
      });
      
      // If we got no items, break even if there's a nextToken
      if (readStatuses.data.length === 0) break;
      
      readStatuses.data.forEach(status => readArticleIds.add(status.articleId));
      nextToken = readStatuses.nextToken ?? undefined;
    } while (nextToken);
    
    return readArticleIds;
  }
  
  
  async function fetchUnreadArticles(feedIds: string[], readArticleIds: Set<string>, limit: number = 10) {
    let nextToken: string | undefined;
    
    do {
      const response = await client.models.Article.list({
        filter: {
          or: feedIds.map(feedId => ({
            feedId: { eq: feedId }
          }))
        },
        limit: limit * 2, // Fetch more than we need since we'll filter some out
        nextToken
      });
      
      // Filter out read articles client-side
      const unreadArticles = response.data.filter(
        article => !readArticleIds.has(article.id)
      );
  
      // If we found enough unread articles, return them
      if (unreadArticles.length >= limit) {
        return unreadArticles.slice(0, limit);
      }
      
      // If we got less than we asked for and there's no next page,
      // return what we have
      if (!response.nextToken) {
        return unreadArticles;
      }
      
      nextToken = response.nextToken;
    } while (nextToken);
    
    return [];
  }

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

  // Prefetch next article
  useEffect(() => {
    async function prefetchNextArticle() {
      if (!currentArticle || !appState.summarizer || !appState.isInitialized) return;

      try {
        const nextArticle = await fetchNextUnreadArticle(currentArticle.id);
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
      
      setReadArticleIds(prev => new Set(prev).add(currentArticle.id));
      
      if (nextArticleData) {
        setCurrentArticle(nextArticleData.article);
        setCurrentSummary(nextArticleData.summary);
        setNextArticleData(null);
      } else {
        const nextArticle = await fetchNextUnreadArticle(currentArticle.id);
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
