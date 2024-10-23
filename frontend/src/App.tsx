import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Link, Route, Routes } from 'react-router-dom';
import AdminWebsites from './components/AdminWebsites.tsx';
import WebsiteFeeds from './components/WebsiteFeeds.tsx';
import WebsiteList from './components/WebsiteList';
import { fetchAuthSession } from 'aws-amplify/auth';
import Home from './components/Home';
import Summarizer from './components/Summarizer.tsx';
import Extractor from './components/Extractor';
import AdminEditFeeds from './components/AdminEditFeeds.tsx'
import Feed from './components/Feed.tsx'
import Article from './components/Article'

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
      }
    }

    checkAdminStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <>
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/Summarizer">Summarizer</Link></li>
              <li><Link to="/extractor">Extractor</Link></li>
              <li><Link to="/websites">Websites</Link></li>
              {!isAdmin && <li><Link to="/admin/websites">Manage Websites</Link></li>}
            </ul>
          </nav>
          <button className="sign-out-button" onClick={signOut}>Sign out</button>
          <main>
            <Routes>
              <Route path="/" element={<Home />}/>
              <Route path="/Summarizer" element={<Summarizer />}/>
              <Route path="/extractor" element={<Extractor />}/>
              <Route path="/websites" element={<WebsiteList />}/>
              <Route path="/website/:websiteId" element={<WebsiteFeeds />} />
              <Route path="/feed/:feedId" element={<Feed />} />
              <Route path="/article/:articleId" element={<Article />} />
              {!isAdmin && (
                <Route path="/admin/websites" element={<AdminWebsites />} />
              )}
              {!isAdmin && (
                <Route path="/admin/editFeeds/:websiteId" element={<AdminEditFeeds />} />
              )}
            </Routes>
          </main>
        </>
      )}
    </Authenticator>
  );
}

export default App;
