import { Typography, Box } from '@mui/material';

function Home() {  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h2" component="h1">
        Home
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">
          Dunno what im putting here, probably a list of user favorited websites
        </Typography>
      </Box>
    </Box>
  );
}

export default Home;