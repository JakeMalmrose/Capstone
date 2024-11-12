import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  useMediaQuery,
  useTheme,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Article as ArticleIcon,
  Language as LanguageIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  AutoStories as ReadIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './Theme';
import { fetchAuthSession } from 'aws-amplify/auth';
//components
import AdminPortal from './components/admin/AdminPortal';
import AdminWebsites from './components/admin/AdminWebsites';
import AdminEditFeeds from './components/admin/AdminEditFeeds';
import AdminAllFeeds from './components/admin/AdminAllFeeds';
import AdminEditSummarizers from './components/admin/AdminEditSummarizers';
import WebsiteFeeds from './components/WebsiteFeeds';
import WebsiteList from './components/WebsiteList';
import Home from './components/Home';
import Summarizer from './components/Summarizer';
import Extractor from './components/Extractor';
import Feed from './components/Feed';
import Article from './components/Article';
import MyFeeds from './components/MyFeeds';
import UserPreferences from './components/UserPreferences';
import UnreadArticles from './components/UnreadArticles';

const DRAWER_WIDTH = 240;

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload['cognito:groups'];
        setIsAdmin(Array.isArray(groups) && groups.includes('Admin'));
      } catch (error) {
        console.error('Error fetching user session:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
        setIsAdmin(true);
      }
    }

    checkAdminStatus();
  }, []);

  const navigationItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'My Newsfeed', icon: <ReadIcon />, path: '/unread' },
    { text: 'My feeds', icon: <ArticleIcon />, path: '/MyFeeds' },
    { text: 'Browse All Websites', icon: <LanguageIcon />, path: '/websites' },
    { text: 'Preferences', icon: <SettingsIcon />, path: '/preferences' },
    ...(isAdmin ? [{ text: 'Admin Portal', icon: <AdminIcon />, path: '/admin' }] : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ mt: 1 }}>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              onClick={() => isMobile && handleDrawerToggle()}
              sx={{
                color: 'text.primary',
                '&.active': {
                  backgroundColor: 'rgba(156, 39, 176, 0.16)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: 'background.default'
        }}>
          Loading...
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator>
        {({ signOut }) => (
          <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
              position="fixed"
              sx={{
                width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                ml: { sm: `${DRAWER_WIDTH}px` },
              }}
            >
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { sm: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }} />
                <Button 
                  color="inherit" 
                  onClick={signOut}
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }
                  }}
                >
                  Sign out
                </Button>
              </Toolbar>
            </AppBar>

            <Box
              component="nav"
              sx={{ 
                width: { sm: DRAWER_WIDTH }, 
                flexShrink: { sm: 0 } 
              }}
            >
              <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: DRAWER_WIDTH,
                  },
                  display: { xs: 'block', sm: 'block' },
                }}
              >
                {drawer}
              </Drawer>
            </Box>

            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: { xs: 0, sm: 3 },
                width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                mt: '64px',
                overflow: 'auto',
              }}
            >
              <Container 
                disableGutters={isMobile}
                sx={{
                  maxWidth: '100% !important',
                  px: { xs: 0, sm: 3 }
                }}
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/unread" element={<UnreadArticles />} />
                  <Route path="/Summarizer" element={<Summarizer />} />
                  <Route path="/MyFeeds" element={<MyFeeds />} />
                  <Route path="/extractor" element={<Extractor />} />
                  <Route path="/websites" element={<WebsiteList />} />
                  <Route path="/website/:websiteId" element={<WebsiteFeeds />} />
                  <Route path="/feed/:feedId" element={<Feed />} />
                  <Route path="/article/:articleId" element={<Article />} />
                  <Route path="/preferences" element={<UserPreferences />} />
                  {isAdmin && (
                    <>
                      <Route path="/admin" element={<AdminPortal />} />
                      <Route path="/admin/websites" element={<AdminWebsites />} />
                      <Route path="/admin/editFeeds/:websiteId" element={<AdminEditFeeds />} />
                      <Route path="/admin/allFeeds" element={<AdminAllFeeds />} />
                      <Route path="/admin/editSummarizers" element={<AdminEditSummarizers />} />
                    </>
                  )}
                </Routes>
              </Container>
            </Box>
          </Box>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;
