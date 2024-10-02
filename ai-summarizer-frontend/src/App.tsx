// src/App.tsx

import React from 'react';
import { CssBaseline } from '@mui/material';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <>
      <CssBaseline />
      <Home />
    </>
  );
};

export default App;