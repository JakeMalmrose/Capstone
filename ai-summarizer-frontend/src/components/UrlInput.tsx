// src/components/UrlInput.tsx

import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

interface UrlInputProps {
  onSubmit: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(url);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Enter URL"
        variant="outlined"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" color="primary">
        Summarize
      </Button>
    </Box>
  );
};

export default UrlInput;