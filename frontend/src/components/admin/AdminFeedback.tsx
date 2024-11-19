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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Link,
  Divider
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

type Feedback = Schema['Feedback']['type'];
type Article = Schema['Article']['type'];
type Summaries = Array<Schema['Summary']['type']>;
type FeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

interface DetailModalProps {
  open: boolean;
  feedback: Feedback | null;
  onClose: () => void;
  onSave: (id: string, notes: string) => void;
}

function DetailModal({ open, feedback, onClose, onSave }: DetailModalProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [summaries, setSummaries] = useState<Summaries | null>(null);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    if (feedback?.adminNotes) {
      setAdminNotes(feedback.adminNotes);
    } else {
      setAdminNotes('');
    }

    const fetchArticleDetails = async () => {
      if (feedback?.articleId) {
        try {
          // Fetch article
          const articleResult = await client.models.Article.get({ id: feedback.articleId });
          if (articleResult.data) {
            setArticle(articleResult.data);

            // Fetch all summaries for the article
            const summariesResult = await client.models.Summary.list({
              filter: { articleId: { eq: feedback.articleId } },
            });
            if (summariesResult.data) {
              setSummaries(summariesResult.data);
            } else {
              setSummaries([]);
            }
          }
        } catch (err) {
          console.error('Error fetching article details:', err);
        }
      }
    };

    if (open && feedback) {
      fetchArticleDetails();
      setShowFullText(false);
    }
  }, [feedback, open]);

  if (!feedback) return null;

  const displayText = article?.fullText 
    ? showFullText 
      ? article.fullText 
      : article.fullText.slice(0, 40) + '...'
    : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Feedback Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Feedback Information</Typography>
          <Typography><strong>Type:</strong> {feedback.type}</Typography>
          <Typography><strong>Title:</strong> {feedback.title}</Typography>
          <Typography><strong>Description:</strong> {feedback.description}</Typography>
          <Typography><strong>Status:</strong> {feedback.status}</Typography>
          <Typography><strong>Created At:</strong> {new Date(feedback.createdAt).toLocaleString()}</Typography>

          {article && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Article Information</Typography>
              <Typography><strong>Title:</strong> {article.title}</Typography>
              <Typography><strong>URL:</strong> {' '}
                <Link href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.url}
                </Link>
              </Typography>
              <Typography><strong>Full Text:</strong></Typography>
              <Paper sx={{ p: 2, mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <Typography>{displayText}</Typography>
                {article.fullText && article.fullText.length > 40 && (
                  <Button 
                    onClick={() => setShowFullText(!showFullText)}
                    sx={{ mt: 1 }}
                  >
                    {showFullText ? 'Show less' : 'Show all'}
                  </Button>
                )}
              </Paper>
            </Box>
          )}

          {summaries && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Summaries</Typography>
              <Paper sx={{ p: 2, mt: 1, maxHeight: 300, overflow: 'auto' }}>
                {summaries.map((summary, index) => (
                  <Box key={summary.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Summary {index + 1}
                    </Typography>
                    <Typography paragraph>{summary.text}</Typography>
                    {summary.specialRequests && (
                      <>
                        <Typography variant="subtitle2" color="secondary">
                          Special Requests:
                        </Typography>
                        <Typography paragraph sx={{ pl: 2, fontStyle: 'italic' }}>
                          {summary.specialRequests}
                        </Typography>
                      </>
                    )}
                    {index < summaries.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Admin Notes</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add admin notes here..."
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => {
            onSave(feedback.id, adminNotes);
            onClose();
          }} 
          variant="contained"
        >
          Save Notes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

  const handleSaveNotes = async (feedbackId: string, notes: string) => {
    try {
      await client.models.Feedback.update({
        id: feedbackId,
        adminNotes: notes
      });
    } catch (err) {
      console.error('Error updating admin notes:', err);
      setError('Failed to update admin notes');
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
                    <TableCell>Actions</TableCell>
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
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setDetailModalOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <DetailModal
        open={detailModalOpen}
        feedback={selectedFeedback}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedFeedback(null);
        }}
        onSave={handleSaveNotes}
      />
    </Box>
  );
}
