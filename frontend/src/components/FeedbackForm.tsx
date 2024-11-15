import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box
} from '@mui/material';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface FeedbackFormProps {
  open: boolean;
  onClose: () => void;
  article: {
    id: string;
    title: string;
    url: string;
  };
}

export default function FeedbackForm({ open, onClose, article }: FeedbackFormProps) {
  const { user } = useAuthenticator();
  const [type, setType] = useState<'BUG' | 'FEEDBACK'>('FEEDBACK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await client.models.Feedback.create({
        type,
        status: 'NEW',
        title: title.trim(),
        description: description.trim(),
        userId: user.userId,
        articleId: article.id,
        articleTitle: article.title,
        articleUrl: article.url,
      });

      // Reset form and close
      setTitle('');
      setDescription('');
      setType('FEEDBACK');
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Submit {type === 'BUG' ? 'Bug Report' : 'Feedback'}</DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        
        <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as 'BUG' | 'FEEDBACK')}
          >
            <MenuItem value="BUG">Bug Report</MenuItem>
            <MenuItem value="FEEDBACK">Feedback</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={4}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
