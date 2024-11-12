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

interface ArticleWithSummary {
  article: Schema['Article']['type'];
  summary: SummaryState;
}

function UnreadArticles() {
  const [currentArticleData, setCurrentArticleData] = useState<ArticleWithSummary | null>(null);
  const [nextArticleData, setNextArticleData] = useState<ArticleWithSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!defaultSummarizer) return null;

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
        return {
          text: existingSummaries.data[0].text,
          loading: false,
          error: null
        };
      }

      // If no existing summary, generate new one
      const result = await client.queries.summarize({
        text: fullText,
        articleId: articleId,
        summarizerId: defaultSummarizer.id,
        userId: userId
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

  const fetchNextUnreadArticle = async (excludeArticleId?: string): Promise<ArticleWithSummary | null> => {
    if (!defaultSummarizer) return null;
    
    try {
      const user = await getCurrentUser();
      
      const userFeeds = await client.models.UserFeedSubscription.list({
        filter: {
          userId: { eq: user.userId }
        }
      });
      
      const feedIds = userFeeds.data.map(sub => sub.feedId);
      
      const articles = await client.models.Article.list({
        filter: {
          or: feedIds.map(feedId => ({
            feedId: { eq: feedId }
          }))
        }
      });
      
      const readStatuses = await client.models.UserArticleStatus.list({
        filter: {
          userId: { eq: user.userId },
          isRead: { eq: true }
        }
      });
      
      const readArticleIds = new Set(readStatuses.data.map(status => status.articleId));
      
      // Find first unread article that's not the excluded one
      const unreadArticle = articles.data.find(
        article => !readArticleIds.has(article.id) && article.id !== excludeArticleId
      );
      
      if (unreadArticle && unreadArticle.fullText) {
        const summary = await fetchSummary(unreadArticle.id, unreadArticle.fullText, user.userId);
        return {
          article: unreadArticle,
          summary: summary || { text: '', loading: false, error: null }
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching unread article:', err);
      throw new Error('Failed to load unread articles');
    }
  };
  
  const markAsRead = async () => {
    if (!currentArticleData?.article) return;
    
    try {
      const user = await getCurrentUser();
      await client.models.UserArticleStatus.create({
        userId: user.userId,
        articleId: currentArticleData.article.id,
        isRead: true,
        readAt: new Date().toISOString(),
      });
      
      // Move next article to current
      if (nextArticleData) {
        setCurrentArticleData(nextArticleData);
        // Start fetching the next article
        setNextArticleData(null);
        const newNextArticle = await fetchNextUnreadArticle(nextArticleData.article.id);
        setNextArticleData(newNextArticle);
      } else {
        setCurrentArticleData(null);
      }
    } catch (err) {
      console.error('Error marking article as read:', err);
      setError('Failed to mark article as read. Please try again.');
    }
  };

  // Initial load of current and next articles
  useEffect(() => {
    async function loadInitialArticles() {
      if (!defaultSummarizer) return;
      
      try {
        setLoading(true);
        // Fetch current article
        const current = await fetchNextUnreadArticle();
        setCurrentArticleData(current);
        
        // If we found a current article, fetch the next one
        if (current) {
          const next = await fetchNextUnreadArticle(current.article.id);
          setNextArticleData(next);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading initial articles:', err);
        setError('Failed to load articles. Please try again later.');
        setLoading(false);
      }
    }
    
    loadInitialArticles();
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

  if (!currentArticleData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No unread articles available! Subscribe to more feeds to discover new content.
        </Alert>
      </Box>
    );
  }

  const { article: currentArticle, summary: currentSummary } = currentArticleData;
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