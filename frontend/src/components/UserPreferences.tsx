import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { 
  Typography, 
  Box, 
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import client from '../../amplify/services/client';

interface Summarizer {
  id: string;
  name: string;
  description?: string | null;
  tier: 'FREE' | 'PRO' | null;
}

interface UserPreference {
  id: string;
  userId: string;
  isPremium: boolean | null;
  defaultSummarizerId: string | null;
  specialRequests: string | null;
  lastUpdated: string | null;
}

export default function UserPreferences() {
  const { user } = useAuthenticator();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [summarizers, setSummarizers] = useState<Summarizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user preferences
        const userPrefsResponse = await client.models.UserPreferences.list({
          filter: {
            userId: {
              eq: user.username
            }
          }
        });

        if (userPrefsResponse.data && userPrefsResponse.data.length > 0) {
          setPreferences(userPrefsResponse.data[0]);
        } else {
          // Create default preferences if none exist
          const newPrefs = {
            userId: user.username,
            isPremium: false,
            defaultSummarizerId: '',
            specialRequests: '',
            lastUpdated: new Date().toISOString()
          };
          const createResponse = await client.models.UserPreferences.create(newPrefs);
          if (createResponse.data) {
            setPreferences(createResponse.data);
          }
        }

        // Load available summarizers
        const summarizersList = await client.models.Summarizer.list();
        if (summarizersList.data) {
          setSummarizers(summarizersList.data);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setError('Failed to load preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!preferences) return;
    
    setSaving(true);
    setError(null);
    try {
      const updateResponse = await client.models.UserPreferences.update({
        id: preferences.id,
        userId: preferences.userId,
        isPremium: preferences.isPremium,
        defaultSummarizerId: preferences.defaultSummarizerId,
        specialRequests: preferences.specialRequests,
        lastUpdated: new Date().toISOString()
      });

      if (updateResponse.data) {
        setPreferences(updateResponse.data);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 100px)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            User Preferences
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              bgcolor: 'background.default',
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[6],
              }
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Premium Toggle */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences?.isPremium || false}
                      onChange={(e) => setPreferences(prev => prev ? {
                        ...prev,
                        isPremium: e.target.checked
                      } : null)}
                      color="primary"
                    />
                  }
                  label="Premium User"
                />
              </Grid>

              {/* Default Summarizer */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Default Summarizer
                </Typography>
                <Select
                  fullWidth
                  value={preferences?.defaultSummarizerId || ''}
                  onChange={(e) => setPreferences(prev => prev ? {
                    ...prev,
                    defaultSummarizerId: e.target.value
                  } : null)}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {summarizers.map((summarizer) => (
                    <MenuItem key={summarizer.id} value={summarizer.id}>
                      {summarizer.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              {/* Special Requests */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Special Requests
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={preferences?.specialRequests || ''}
                  onChange={(e) => setPreferences(prev => prev ? {
                    ...prev,
                    specialRequests: e.target.value
                  } : null)}
                  placeholder="Enter any special requests for AI responses..."
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>

              {/* Save Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving || !preferences}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ 
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
