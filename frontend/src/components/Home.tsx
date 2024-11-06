import { useState, useRef, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface ChatMessage {
  text: string;
  isUser: boolean;
}

type FeedSuggestion = {
  name: string;
  url: string;
  description: string;
  type: "RSS" | "GNEWS" | "OTHER";
  tags?: string[];
  gNewsCategory?: string;
  gNewsCountry?: string;
  searchTerms?: string[];
};

interface ChatResponse {
  response: string;
  feedSuggestion?: FeedSuggestion | null;
}

function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    text: "Hello! I can help you discover and subscribe to news feeds. What topics are you interested in?",
    isUser: false
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedDialog, setFeedDialog] = useState(false);
  const [currentFeed, setCurrentFeed] = useState<FeedSuggestion | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const chatHistory = JSON.stringify(messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      })));

      const response = await client.queries.chatWithLLM({
        message: userMessage,
        chatHistory
      });

      if (response.data) {
        console.log('Chat response:', response.data);
        const chatResponse = response.data as ChatResponse;
        
        if (chatResponse.response) {
          setMessages(prev => [...prev, { 
            text: chatResponse.response, 
            isUser: false 
          }]);

          if (chatResponse.feedSuggestion) {
            console.log('Feed suggestion:', chatResponse.feedSuggestion);
            setCurrentFeed(chatResponse.feedSuggestion);
            setFeedDialog(true);
          }
        }
      }
    } catch (err) {
      console.error('Error in chat:', err);
      setError('Failed to process message. Please try again.');
      setMessages(prev => [...prev, { 
        text: "I apologize, but I encountered an error. Please try again.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeToFeed = async () => {
    if (!currentFeed) return;

    setIsSubscribing(true);
    try {
      const { userId } = await getCurrentUser();

      // Create website first
      const websiteResponse = await client.models.Website.create({
        name: currentFeed.name,
        url: currentFeed.type === 'GNEWS' ? 'https://gnews.io' : new URL(currentFeed.url).origin,
        category: "news",
        tags: currentFeed.tags
      });

      if (!websiteResponse.data) {
        throw new Error('Failed to create website');
      }

      // Create feed with GNews specific fields if present
      const feedResponse = await client.models.Feed.create({
        name: currentFeed.name,
        url: currentFeed.url,
        description: currentFeed.description,
        type: currentFeed.type,
        websiteId: websiteResponse.data.id,
        tags: currentFeed.tags,
        gNewsCategory: currentFeed.gNewsCategory as "general" | "world" | "nation" | "business" | "technology" | "entertainment" | "sports" | "science" | "health" | null | undefined,
        gNewsCountry: currentFeed.gNewsCountry as "us" | "gb" | "au" | "ca" | "in" | null | undefined,
        searchTerms: currentFeed.searchTerms
      });

      if (!feedResponse.data) {
        throw new Error('Failed to create feed');
      }

      // Create subscription
      await client.models.UserFeedSubscription.create({
        feedId: feedResponse.data.id,
        userId,
        subscriptionDate: new Date().toISOString(),
        notificationsEnabled: true
      });

      client.mutations.fetchGNews({
        websiteId: websiteResponse.data.id,
        feedId: feedResponse.data.id
      })

      setFeedDialog(false);
      setMessages(prev => [...prev, {
        text: `Successfully subscribed to "${currentFeed.name}". You can view it in your feeds section.`,
        isUser: false
      }]);
    } catch (err) {
      console.error('Error subscribing to feed:', err);
      setError('Failed to subscribe to feed. Please try again.');
      setMessages(prev => [...prev, {
        text: "I apologize, but I couldn't subscribe to the feed. Please try again.",
        isUser: false
      }]);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Chat Assistant
          </Typography>
        </Grid>

        <Grid item xs={12}>
          {/* Chat Messages */}
          <Paper 
            elevation={3} 
            sx={{ 
              height: 'calc(100vh - 250px)',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[6],
              }
            }}
          >
            {error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}
            
            <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: message.isUser ? 'primary.main' : 'background.paper',
                      color: message.isUser ? 'primary.contrastText' : 'text.primary',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <ListItemText primary={message.text} />
                  </Paper>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>

            {/* Message Input */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={4}
                  disabled={isLoading}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  sx={{ 
                    alignSelf: 'flex-end',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Feed Subscription Dialog */}
      <Dialog 
        open={feedDialog} 
        onClose={() => !isSubscribing && setFeedDialog(false)}
        PaperProps={{
          sx: { 
            bgcolor: 'background.paper',
            minWidth: '400px'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RssFeedIcon color="primary" />
            <Typography variant="h6">Subscribe to Feed</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentFeed && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {currentFeed.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {currentFeed.description}
              </Typography>
              {currentFeed.tags && currentFeed.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {currentFeed.tags.map((tag) => (
                    <Chip 
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(224, 194, 255, 0.08)',
                      }}
                    />
                  ))}
                </Box>
              )}
              {currentFeed.type === 'GNEWS' && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentFeed.gNewsCategory && (
                    <Chip 
                      label={`Category: ${currentFeed.gNewsCategory}`}
                      size="small"
                      color="primary"
                    />
                  )}
                  {currentFeed.gNewsCountry && (
                    <Chip 
                      label={`Country: ${currentFeed.gNewsCountry}`}
                      size="small"
                      color="secondary"
                    />
                  )}
                  {currentFeed.searchTerms && currentFeed.searchTerms.length > 0 && (
                    <Chip 
                      label={`Search: ${currentFeed.searchTerms.join(', ')}`}
                      size="small"
                      color="info"
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFeedDialog(false)} 
            disabled={isSubscribing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubscribeToFeed} 
            variant="contained"
            disabled={isSubscribing}
            startIcon={isSubscribing ? <CircularProgress size={20} /> : <RssFeedIcon />}
          >
            {isSubscribing ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Home;
