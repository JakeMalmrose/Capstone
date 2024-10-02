// src/pages/Home.tsx

import React from 'react';
import { Container, Typography } from '@mui/material';
import UrlInput from '../components/UrlInput';

const Home: React.FC = () => {
  const handleUrlSubmit = (url: string) => {
    // TODO: Implement URL submission logic
    console.log('Submitted URL:', url);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        AI-Powered Content Summarizer
      </Typography>
      <UrlInput onSubmit={handleUrlSubmit} />
    </Container>
  );
};

export default Home;