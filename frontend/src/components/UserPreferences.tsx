import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
//import { loadStripe } from '@stripe/stripe-js';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

// Initialize Stripe - replace with your publishable key
//const stripePromise = loadStripe('pk_live_51QLqQbA1lmpQFQfrmLGOCtdWWknSWupGMA4YHnueQx2Nvy8nvEZMsmFJwAVP7OEjNcbYdXnJqdz2QaKI0xKdt6JR00botja8MB');

type UserPreference = Schema['UserPreferences']['type'];
type SpecialRequestPreset = Schema['SpecialRequestPreset']['type'];
type Summarizer = Schema['Summarizer']['type'];

const client = generateClient<Schema>();

const PREMIUM_PRICE = 9.99; // Monthly subscription price

export default function UserPreferences() {
  const { user } = useAuthenticator();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [summarizers, setSummarizers] = useState<Summarizer[]>([]);
  const [specialRequestPresets, setSpecialRequestPresets] = useState<SpecialRequestPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

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
    if (key === 'isPremium' && !preferences?.isPremium && value === true) {
      setPaymentDialogOpen(true);
      return;
    }
    
    setPreferences(prev => prev ? {
      ...prev,
      [key]: value
    } : null);
  };

  const handlePaymentStart = async () => {
    setProcessingPayment(true);
    try {
      // Create checkout session using Amplify API
      const response = await client.mutations.createStripeCheckout({
        priceId: 'price_1QLuzfA1lmpQFQfrRT8ecrrZ', // You can hardcode this or pass it as an env variable
        userId: user.username
      });
  
      if (response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed. Please try again.');
      setProcessingPayment(false);
    }
  };
  
  // Add this useEffect to handle redirect back from Stripe
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      
      // Reload the user preferences to get updated premium status
      const loadData = async () => {
        try {
          const userPrefsResponse = await client.models.UserPreferences.list({
            filter: {
              userId: {
                eq: user.username
              }
            }
          });
  
          if (userPrefsResponse.data && userPrefsResponse.data.length > 0) {
            setPreferences(userPrefsResponse.data[0]);
          }
        } catch (error) {
          console.error('Error reloading preferences:', error);
        }
      };
  
      loadData();
    }
  }, [user?.username]);

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
              {/* Premium Status */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences?.isPremium || false}
                        onChange={(e) => handlePreferenceChange('isPremium', e.target.checked)}
                        color="primary"
                        disabled={!preferences?.isPremium}
                      />
                    }
                    label="Premium User"
                  />
                  {!preferences?.isPremium && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CreditCardIcon />}
                      onClick={() => setPaymentDialogOpen(true)}
                      sx={{ ml: 2 }}
                    >
                      Upgrade to Premium
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Rest of the existing preferences remain the same */}
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

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving || !preferences}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => !processingPayment && setPaymentDialogOpen(false)}>
        <DialogTitle>Upgrade to Premium</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Upgrade to premium for ${PREMIUM_PRICE}/month to unlock all features:
            <Box component="ul" sx={{ mt: 1 }}>
              <li>Access to all summarizers</li>
              <li>Unlimited article summaries</li>
              <li>Custom summarization styles</li>
              <li>Priority support</li>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            disabled={processingPayment}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePaymentStart}
            disabled={processingPayment}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <CreditCardIcon />}
          >
            {processingPayment ? 'Processing...' : `Subscribe for $${PREMIUM_PRICE}/month`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}