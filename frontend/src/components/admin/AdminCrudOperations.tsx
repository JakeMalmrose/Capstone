import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import AdminWebsites from './AdminWebsites';
import AdminAllFeeds from './AdminAllFeeds';
import AdminEditSummarizers from './AdminEditSummarizers';
import AdminSpecialRequestPresets from './AdminSpecialRequestPresets';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`crud-tabpanel-${index}`}
      aria-labelledby={`crud-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `crud-tab-${index}`,
    'aria-controls': `crud-tabpanel-${index}`,
  };
}

export default function AdminCrudOperations() {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" component="h1" sx={{ mb: 4 }}>
        Manage Resources
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="admin crud operations"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Tab label="Websites" {...a11yProps(0)} />
          <Tab label="Feeds" {...a11yProps(1)} />
          <Tab label="Summarizers" {...a11yProps(2)} />
          <Tab label="Special Request Presets" {...a11yProps(3)} />
        </Tabs>

        <TabPanel value={value} index={0}>
          <AdminWebsites />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <AdminAllFeeds />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <AdminEditSummarizers />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <AdminSpecialRequestPresets />
        </TabPanel>
      </Paper>
    </Box>
  );
}
