import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  Grid
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

type Feedback = Schema['Feedback']['type'];
type FeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = client.models.Feedback.observeQuery().subscribe({
      next: ({ items }) => {
        // Sort by creation date, newest first
        const sortedItems = [...items].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setFeedbacks(sortedItems);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching feedback:', error);
        setError('Failed to load feedback items');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      await client.models.Feedback.update({
        id: feedbackId,
        status: newStatus,
        ...(newStatus === 'RESOLVED' ? { resolvedAt: new Date().toISOString() } : {})
      });
    } catch (err) {
      console.error('Error updating feedback status:', err);
      setError('Failed to update status');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Feedback Management
          </Typography>
        </Grid>

        {loading && (
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        )}

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper 
            elevation={3}
            sx={{
              overflow: 'hidden',
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[6],
              }
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Article</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedbacks.map((feedback) => (
                    <TableRow 
                      key={feedback.id}
                      sx={{
                        transition: 'background-color 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={feedback.type === 'BUG' ? 'error' : 'primary'}
                        >
                          {feedback.type}
                        </Typography>
                      </TableCell>
                      <TableCell>{feedback.title}</TableCell>
                      <TableCell>{feedback.description}</TableCell>
                      <TableCell>
                        {feedback.articleUrl && feedback.articleTitle ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {feedback.articleTitle}
                            </Typography>
                            <Tooltip title="Open article">
                              <IconButton
                                size="small"
                                onClick={() => window.open(feedback.articleUrl as string, '_blank')}
                              >
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small">
                          <Select
                            value={feedback.status || 'NEW'}
                            onChange={(e) => handleStatusChange(feedback.id, e.target.value as FeedbackStatus)}
                            sx={{ 
                              minWidth: 120,
                              '& .MuiSelect-select': {
                                color: feedback.status === 'RESOLVED' 
                                  ? 'success.main'
                                  : feedback.status === 'IN_PROGRESS'
                                  ? 'warning.main'
                                  : 'inherit'
                              }
                            }}
                          >
                            <MenuItem value="NEW">New</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                            <MenuItem value="RESOLVED">Resolved</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {feedback.createdAt
                          ? new Date(feedback.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
