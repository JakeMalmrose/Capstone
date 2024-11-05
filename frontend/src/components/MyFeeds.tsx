import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import type { Schema } from '../../amplify/data/resource';
import { RssFeed as RssIcon } from '@mui/icons-material';
import StarIcon from '@mui/icons-material/Star';
import WebsiteIcon from '@mui/icons-material/Language';

const client = generateClient<Schema>();

type SubscribedFeed = Omit<Schema['Feed']['type'], 'website'> & {
    website?: Omit<Schema['Website']['type'], 'feeds'>;
    subscriptionDate?: string;
  };

function SubscribedFeeds() {
  const [feeds, setFeeds] = useState<SubscribedFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscribedFeeds() {
      try {
        const user = await getCurrentUser();
        
        // Get all user's subscriptions
        const subscriptionsResponse = await client.models.UserFeedSubscription.list({
          filter: { userId: { eq: user.userId } }
        });

        // Get detailed feed information for each subscription
        const feedPromises = subscriptionsResponse.data.map(async (subscription) => {
            try {
              const feedResponse = await client.models.Feed.get({ id: subscription.feedId });
              if (!feedResponse.data) return null;
              
              const websiteResponse = await client.models.Website.get({ 
                id: feedResponse.data.websiteId 
              });
              
              const feed: SubscribedFeed = {
                ...feedResponse.data,
                website: websiteResponse.data ?? undefined,
                subscriptionDate: subscription.subscriptionDate || undefined,
              };
              
              return feed;
            } catch (err) {
              console.error('Error fetching feed details:', err);
              return null;
            }
          });
          
          const resolvedFeeds = (await Promise.all(feedPromises)).filter((feed): feed is SubscribedFeed => 
            feed !== null && feed !== undefined
          );
          setFeeds(resolvedFeeds);
      } catch (err) {
        console.error('Error fetching subscribed feeds:', err);
        setError('Failed to load subscribed feeds. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscribedFeeds();
  }, []);

  const handleUnsubscribe = async (feedId: string) => {
    try {
      const user = await getCurrentUser();
      
      // Find the subscription
      const subscriptionsResponse = await client.models.UserFeedSubscription.list({
        filter: { 
          userId: { eq: user.userId },
          feedId: { eq: feedId }
        }
      });

      const subscription = subscriptionsResponse.data[0];
      if (subscription?.id) {
        await client.models.UserFeedSubscription.delete({
          id: subscription.id
        });

        // Update local state
        setFeeds(prevFeeds => prevFeeds.filter(feed => feed.id !== feedId));
      }
    } catch (err) {
      console.error('Error unsubscribing from feed:', err);
      setError('Failed to unsubscribe from feed. Please try again.');
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

  if (feeds.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          You haven't subscribed to any feeds yet. Browse websites or chat on our homepage to find interesting feeds to follow!
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Subscribed Feeds
      </Typography>

      <Grid container spacing={3}>
        {feeds.map((feed) => (
          <Grid item xs={12} md={6} key={feed.id}>
            <Card 
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => theme.shadows[4],
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {feed.name}
                  </Typography>
                  <Tooltip title="Unsubscribe">
                    <IconButton
                      onClick={() => handleUnsubscribe(feed.id)}
                      color="primary"
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(224, 194, 255, 0.08)' 
                        } 
                      }}
                    >
                      <StarIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {feed.website && (
                  <Button
                    component={RouterLink}
                    to={`/website/${feed.website.id}`}
                    startIcon={<WebsiteIcon />}
                    sx={{ mb: 2 }}
                    color="secondary"
                    size="small"
                  >
                    {feed.website.name}
                  </Button>
                )}

                {feed.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feed.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                  <Chip 
                    label={feed.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {feed.tags?.map((tag) => (
                    <Chip 
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(224, 194, 255, 0.08)',
                      }}
                    />
                  ))}
                </Stack>

                {feed.subscriptionDate && (
                  <Typography variant="caption" color="text.secondary">
                    Subscribed on: {new Date(feed.subscriptionDate).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button
                  component={RouterLink}
                  to={`/feed/${feed.id}`}
                  variant="outlined"
                  size="small"
                  startIcon={<RssIcon />}
                >
                  View Feed
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default SubscribedFeeds;