import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Link, Route, Routes } from 'react-router-dom';
import Websites from './components/Websites';


function App() {
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
            </ul>
          </nav>
          <button className="sign-out-button" onClick={signOut}>Sign out</button>
          <main>
            <Routes>
              <Route path="/websites" element={<Websites />} />
            </Routes>
          </main>
        </>
      )}
    </Authenticator>
  );
}

export default App;