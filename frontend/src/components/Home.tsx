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

interface ChatResponse {
  response: string;
  feed: string | null;
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
  const [currentFeed, setCurrentFeed] = useState<Schema["Feed"]["type"]>();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isFetchingFeed, setIsFetchingFeed] = useState(false);

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
  
          if (chatResponse.feed) {
            console.log('Feed ID:', chatResponse.feed);
            setIsFetchingFeed(true);
            try {
              const feedResponse = await client.models.Feed.get({
                id: chatResponse.feed
              });
              
              if (feedResponse.data) {
                console.log('Fetched feed:', feedResponse.data);
                
                setCurrentFeed(feedResponse.data);
                setFeedDialog(true);
              }
            } catch (err) {
              console.error('Error fetching feed:', err);
              setError('Failed to fetch feed details. Please try again.');
            } finally {
              setIsFetchingFeed(false);
            }
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
  
      const existingSubscription = await client.models.UserFeedSubscription.list({
        filter: {
          feedId: { eq: currentFeed.id },
          userId: { eq: userId }
        }
      });
  
      if (!existingSubscription.data || existingSubscription.data.length === 0) {
        await client.models.UserFeedSubscription.create({
          feedId: currentFeed.id,
          userId,
          subscriptionDate: new Date().toISOString(),
          notificationsEnabled: true
        });

        await client.mutations.fetchGNews({
          feedId: currentFeed.id,
          websiteId: currentFeed.websiteId
        })

        // Populate unread articles for the new subscription
        await client.queries.populateUnreadArticles({
          userId,
          feedId: currentFeed.id
        });
      }
  
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
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <ListItemText 
                      primary={message.text} 
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: message.isUser ? '#212121' : 'text.primary'
                        }
                      }}
                    />
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
        onClose={() => !isSubscribing && !isFetchingFeed && setFeedDialog(false)}
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
          {isFetchingFeed ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : currentFeed && (
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
            disabled={isSubscribing || isFetchingFeed}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubscribeToFeed} 
            variant="contained"
            disabled={isSubscribing || isFetchingFeed}
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
