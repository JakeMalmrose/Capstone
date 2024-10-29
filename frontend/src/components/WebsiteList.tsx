import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function WebsiteList() {
  const [websites, setWebsites] = useState<Schema['Website']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWebsites() {
      try {
        const response = await client.models.Website.list();
        setWebsites(response.data);
      } catch (err) {
        console.error('Error fetching websites:', err);
        setError('Failed to load websites. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchWebsites();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}
      >
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
        All Websites
      </Typography>
      
      <Grid container spacing={3}>
        {websites.map((website) => (
          <Grid item xs={12} sm={6} md={4} key={website.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8],
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {website.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 1.5, wordBreak: 'break-word' }}
                >
                  {website.url}
                </Typography>
                
                {website.category && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Category: {website.category}
                  </Typography>
                )}
                
                {website.tags && website.tags.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  component={Link}
                  to={`/website/${website.id}`}
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 'auto',
                  }}
                >
                  View Feeds
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default WebsiteList;