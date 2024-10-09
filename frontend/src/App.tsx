import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Link, Route, Routes } from 'react-router-dom';
import Websites from './components/Websites';
import WebsiteArticles from './components/WebsiteArticles';
import WebsiteList from './components/WebsiteList';
import { fetchAuthSession } from 'aws-amplify/auth';

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
              <li><Link to="/websites">Websites</Link></li>
              <li><Link to="/feeds">Feeds</Link></li>
              <li><Link to="/summaries">Summaries</Link></li>
              {isAdmin && <li><Link to="/admin/websites">Manage Websites</Link></li>}
            </ul>
          </nav>
          <button className="sign-out-button" onClick={signOut}>Sign out</button>
          <main>
            <Routes>
              <Route path="/"/>
              <Route path="/websites" element={<WebsiteList />}/>
              <Route path="/feeds"/>
              <Route path="/summaries"/>
              <Route path="/website/:websiteId" element={<WebsiteArticles />} />
              {isAdmin && (
                <Route path="/admin/websites" element={<Websites />} />
              )}
            </Routes>
          </main>
        </>
      )}
    </Authenticator>
  );
}

export default App;