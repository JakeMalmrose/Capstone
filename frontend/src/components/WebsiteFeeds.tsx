import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
//import { fetchAuthSession, JWT } from 'aws-amplify/auth';
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
  //Divider,
  Stack,
  //Link,
  Paper,
} from '@mui/material';
import type { Schema } from '../../amplify/data/resource';
import { RssFeed as RssIcon } from '@mui/icons-material';

const client = generateClient<Schema>();

function WebsiteFeeds() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [website, setWebsite] = useState<Schema['Website']['type'] | null>(null);
  const [feeds, setFeeds] = useState<Schema['Feed']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [submitMessage, setSubmitMessage] = useState<{
  //   type: 'success' | 'error',
  //   message: string
  // } | null>(null);

  useEffect(() => {
    async function fetchWebsiteAndFeeds() {
      if (!websiteId) return;
      
      try {
        const websiteResponse = await client.models.Website.get({ id: websiteId });
        setWebsite(websiteResponse.data);

        const feedsResponse = await client.models.Feed.list({
          filter: { websiteId: { eq: websiteId } }
        });
        setFeeds(feedsResponse.data);
      } catch (err) {
        console.error('Error fetching website and feeds:', err);
        setError('Failed to load website and feeds. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchWebsiteAndFeeds();
  }, [websiteId]);

  // const writeRssToDB = async () => {
  //   //this function was largely to test writing to db
  //   if (!website) return;
  //   setIsSubmitting(true);
  //   setSubmitMessage(null);
    
  //   try {
  //     const result = await client.mutations.rssToDB({ 
  //       websiteId: website.id, 
  //       feedUrl: website.url 
  //     });
      
  //     setSubmitMessage({
  //       type: 'success',
  //       message: result.data?.message || "RSS written to DB successfully"
  //     });
  //   } catch (err) {
  //     setSubmitMessage({
  //       type: 'error',
  //       message: (err instanceof Error ? err.message : "Unknown error") || "Error writing RSS to DB"
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

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

  if (!website) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">Website not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Website Header Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          {website.name} Feeds
        </Typography>
        
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary" 
            sx={{ wordBreak: 'break-word' }}>
            {website.url}
          </Typography>
          
          {website.category && (
            <Typography variant="body2">
              Category: {website.category}
            </Typography>
          )}
          
          {website.tags && website.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {website.tags.map((tag) => (
                <Chip 
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(224, 194, 255, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(224, 194, 255, 0.16)',
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>

        
      </Paper>

      {/* Feeds List Section */}
      <Stack spacing={2}>
        {feeds.map((feed) => (
          <Card 
            key={feed.id}
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
                {feed.name}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1.5, wordBreak: 'break-word' }}
              >
                {feed.url}
              </Typography>
              
              {feed.description && (
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {feed.description}
                </Typography>
              )}
              
              <Stack 
                direction="row" 
                spacing={1} 
                alignItems="center" 
                sx={{ mb: 1 }}
              >
                <Chip 
                  label={feed.type}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                
                {feed.tags && feed.tags.length > 0 && (
                  feed.tags.map((tag) => (
                    <Chip 
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(224, 194, 255, 0.08)',
                      }}
                    />
                  ))
                )}
              </Stack>
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
        ))}
      </Stack>
    </Box>
  );
}

export default WebsiteFeeds;