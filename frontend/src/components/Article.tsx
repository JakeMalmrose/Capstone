import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { 
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FeedbackForm from './FeedbackForm';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface SummaryState {
  text: string;
  loading: boolean;
  error: string | null;
}

function Article() {
  const { articleId } = useParams<{ articleId: string }>();
  const { user } = useAuthenticator();
  const [article, setArticle] = useState<Schema['Article']['type'] | null>(null);
  const [summarizers, setSummarizers] = useState<Schema['Summarizer']['type'][]>([]);
  const [selectedSummarizerId, setSelectedSummarizerId] = useState<string>('');
  const [showFullText, setShowFullText] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [summaryState, setSummaryState] = useState<SummaryState>({
    text: '',
    loading: false,
    error: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch article, summarizers, and user preferences on component mount
  useEffect(() => {
    async function fetchData() {
      if (!articleId) return;

      setLoading(true);
      try {
        const [articleResponse, summarizersResponse, preferencesResponse] = await Promise.all([
          client.models.Article.get({ id: articleId }),
          client.models.Summarizer.list(),
          client.models.UserPreferences.list({
            filter: {
              userId: {
                eq: user.username
              }
            }
          })
        ]);

        setArticle(articleResponse.data);
        setSummarizers(summarizersResponse.data);
        
        const userPreferences = preferencesResponse.data[0];
        setIsPremiumUser(userPreferences?.isPremium || false);
        
        // Only set the selectedSummarizerId after all data is loaded
        // If user is not premium, only allow selecting FREE tier summarizers
        const defaultSummarizer = summarizersResponse.data.find(s => 
          userPreferences?.isPremium ? true : s.tier === 'FREE'
        );
        setSelectedSummarizerId(userPreferences?.defaultSummarizerId || defaultSummarizer?.id || '');
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load article or summarizers. Please try again later.');
        setLoading(false);
      }
    }

    fetchData();
  }, [articleId, user.username]);

  // Fetch or generate summary when summarizer is selected and not loading
  useEffect(() => {
    async function fetchSummary() {
      if (!selectedSummarizerId || !article || loading) return;

      setSummaryState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // First try to fetch user-specific summary if user has preferences
        const userPreferences = await client.models.UserPreferences.list({
          filter: {
            userId: { eq: user.username }
          }
        });

        const hasSpecialRequests = userPreferences.data[0]?.specialRequests;
        
        // Try to fetch existing summary based on user preferences
        const existingSummaries = await client.models.Summary.list({
          filter: {
            articleId: { eq: articleId },
            summarizerId: { eq: selectedSummarizerId },
            ...(hasSpecialRequests ? { userId: { eq: user.username } } : { userId: { attributeExists: false } })
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
          text: article.fullText,
          articleId: article.id,
          summarizerId: selectedSummarizerId,
          userId: user.username
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
    }

    fetchSummary();
  }, [selectedSummarizerId, article, articleId, loading, user.username]);

  const handleUpgradeClick = async () => {
    try {
      const response = await client.mutations.createStripeCheckout({
        priceId: 'price_1QLrjwA1lmpQFQfrTzzhxLEF',
        userId: user.username
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to start upgrade process. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!article) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No article found</Typography>
      </Box>
    );
  }

  if (!article.fullText) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 3,
            transition: 'box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: (theme) => theme.shadows[6],
            }
          }}
        >
          <Typography>No text available for this article</Typography>
        </Paper>
      </Box>
    );
  }

  const truncatedText = article.fullText.slice(0, 30) + '...';

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3,
              bgcolor: 'background.paper',
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[6],
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {article.title}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setShowFeedbackForm(true)}
                sx={{ ml: 2 }}
              >
                Submit Feedback
              </Button>
            </Box>
            
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Published: {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Unknown'}
            </Typography>

            {/* Summary Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
              Article Summary
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Summarizer</InputLabel>
                <Select
                  value={selectedSummarizerId}
                  onChange={(e) => setSelectedSummarizerId(e.target.value)}
                  label="Select Summarizer"
                >
                  {summarizers.map(summarizer => {
                    const isPro = summarizer.tier === 'PRO';
                    const isDisabled = isPro && !isPremiumUser;
                    
                    return (
                      <MenuItem 
                        key={summarizer.id} 
                        value={summarizer.id}
                        disabled={isDisabled}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                          <span>{summarizer.name}</span>
                          {isPro && (
                            <Tooltip title={isDisabled ? "Upgrade to Premium to unlock" : "Premium Feature"}>
                              <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                <LockIcon color={isDisabled ? "disabled" : "primary"} fontSize="small" />
                              </ListItemIcon>
                            </Tooltip>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {!isPremiumUser && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CreditCardIcon />}
                    onClick={handleUpgradeClick}
                    size="small"
                  >
                    Upgrade to Premium
                  </Button>
                </Box>
              )}

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
            
            <Divider sx={{ my: 4 }} />
            
            {/* Article Text Section */}
            <Typography variant="h5" gutterBottom>
              Full Article
            </Typography>
            
            <Typography paragraph>
              {showFullText ? article.fullText : truncatedText}
            </Typography>
            
            <Button
              variant="contained"
              onClick={() => setShowFullText(!showFullText)}
              sx={{ 
                mt: 2,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              {showFullText ? 'Show Less' : 'Show More'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <FeedbackForm
        open={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        article={{
          id: article.id,
          title: article.title,
          url: article.url
        }}
      />
    </Box>
  );
}

export default Article;
