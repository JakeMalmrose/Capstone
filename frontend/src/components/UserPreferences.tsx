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
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

type UserPreference = Schema['UserPreferences']['type'];
type SpecialRequestPreset = Schema['SpecialRequestPreset']['type'];
type Summarizer = Schema['Summarizer']['type'];

const client = generateClient<Schema>();

export default function UserPreferences() {
  const { user } = useAuthenticator();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [summarizers, setSummarizers] = useState<Summarizer[]>([]);
  const [specialRequestPresets, setSpecialRequestPresets] = useState<SpecialRequestPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

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
          const defaultPrefs = {
            userId: user.username,
            isPremium: false,
            defaultSummarizerId: '',
            specialRequests: '',
            lastUpdated: new Date().toISOString()
          };
          
          const newPrefs = await client.models.UserPreferences.create(defaultPrefs);
          if (newPrefs.data) {
            setPreferences(newPrefs.data);
          }
        }

        // Load available summarizers
        const summarizersList = await client.models.Summarizer.list();
        if (summarizersList.data) {
          setSummarizers(summarizersList.data);
        }

        // Load special request presets
        const presetsResponse = await client.models.SpecialRequestPreset.list({
          filter: {
            isActive: {
              eq: true
            }
          }
        });
        if (presetsResponse.data) {
          setSpecialRequestPresets(presetsResponse.data);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setError('Failed to load preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      loadData();
    }
  }, [user?.username]);

  const handleSave = async () => {
    if (!preferences?.id) {
      setError('Invalid preferences data');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare update data by only including fields defined in the schema
      const updateData = {
        id: preferences.id,
        userId: preferences.userId,
        isPremium: preferences.isPremium ?? false,
        defaultSummarizerId: preferences.defaultSummarizerId || '',
        specialRequests: preferences.specialRequests || '',
        gNewsCountry: preferences.gNewsCountry,
        gNewsCategory: preferences.gNewsCategory,
        lastUpdated: new Date().toISOString()
      };

      const updateResponse = await client.models.UserPreferences.update(updateData);

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

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const selectedPreset = specialRequestPresets.find(preset => preset.id === presetId);
    if (selectedPreset && preferences) {
      setPreferences({
        ...preferences,
        specialRequests: selectedPreset.content
      });
    }
  };

  const handlePreferenceChange = <K extends keyof UserPreference>(
    key: K,
    value: UserPreference[K]
  ) => {
    setPreferences(prev => prev ? {
      ...prev,
      [key]: value
    } : null);
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
                      onChange={(e) => handlePreferenceChange('isPremium', e.target.checked)}
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
                  onChange={(e) => handlePreferenceChange('defaultSummarizerId', e.target.value)}
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
                <Select
                  fullWidth
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  sx={{ mb: 2, bgcolor: 'background.paper' }}
                >
                  <MenuItem value="">
                    <em>Select a preset</em>
                  </MenuItem>
                  {specialRequestPresets.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={preferences?.specialRequests || ''}
                  onChange={(e) => handlePreferenceChange('specialRequests', e.target.value)}
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