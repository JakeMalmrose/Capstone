import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Grid,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
//import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Schema } from '../../../amplify/data/resource';

type Feed = Schema['Feed']['type'];
type Article = Schema['Article']['type'];
type Summary = Schema['Summary']['type'];
type UserArticleStatus = Schema['UserArticleStatus']['type'];
type Website = Schema['Website']['type'];
type Feedback = Schema['Feedback']['type'];

interface SummarizerPerformance {
  summarizerId: string;
  avgLength: number;
  successRate: number;
}

// interface ChartData {
//   name: string;
//   value: number;
// }

const client = generateClient<Schema>();

// Helper functions for calculating statistics
function calculateMostReadWebsite(
  userArticleStatuses: UserArticleStatus[],
  articles: Article[],
  websites: Website[]
): { name: string; readCount: number } {
  // Create a map of websiteId to read count
  const websiteReadCounts = new Map<string, number>();

  // Get all read articles
  const readStatuses = userArticleStatuses.filter(status => status.isRead);

  // For each read status, find the article and increment the website's count
  readStatuses.forEach(async status => {
    const article = articles.find(a => a.id === status.articleId);
    if (article) {
      const actualFeed = await client.models.Feed.get({ id: article.id });
      if (actualFeed.data) {
        const websiteId = actualFeed.data?.websiteId || '';
        websiteReadCounts.set(
          websiteId,
          (websiteReadCounts.get(websiteId) || 0) + 1
        );
      }
    }
  });

  // Find the website with the highest read count
  let maxCount = 0;
  let mostReadWebsiteId = '';
  websiteReadCounts.forEach((count, websiteId) => {
    if (count > maxCount) {
      maxCount = count;
      mostReadWebsiteId = websiteId;
    }
  });

  // Get the website name
  const website = websites.find(w => w.id === mostReadWebsiteId);
  return {
    name: website?.name || 'Unknown',
    readCount: maxCount
  };
}

function calculateRecentSummaries(summaries: Summary[]): number {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return summaries.filter(summary => 
    new Date(summary.createdAt!) >= last24h
  ).length;
}

function calculateAverageSummaryLength(summaries: Summary[]): number {
  if (summaries.length === 0) return 0;
  
  const totalLength = summaries.reduce((acc, summary) => 
    acc + (summary.text?.length || 0), 0
  );
  return Math.round(totalLength / summaries.length);
}

function calculateSummarizationSuccessRate(summaries: Summary[]): number {
  if (summaries.length === 0) return 0;
  
  const successfulSummaries = summaries.filter(summary => 
    summary.text?.trim().length > 0
  ).length;
  
  return (successfulSummaries / summaries.length) * 100;
}

function calculateAverageResolutionTime(feedback: Feedback[]): number {
  const resolvedFeedback = feedback.filter(f => 
    f.status === 'RESOLVED' && f.resolvedAt
  );
  
  if (resolvedFeedback.length === 0) return 0;
  
  const totalResolutionTime = resolvedFeedback.reduce((acc, f) => {
    const createdAt = new Date(f.createdAt!);
    const resolvedAt = new Date(f.resolvedAt!);
    return acc + (resolvedAt.getTime() - createdAt.getTime());
  }, 0);
  
  // Return average resolution time in hours
  return Math.round((totalResolutionTime / resolvedFeedback.length) / (1000 * 60 * 60));
}

function calculateIssuesByType(feedback: Feedback[]): { type: string; count: number }[] {
  const typeCounts = new Map<string, number>();
  
  feedback.forEach(f => {
    if (f.type) {
      typeCounts.set(
        f.type,
        (typeCounts.get(f.type) || 0) + 1
      );
    }
  });
  
  return Array.from(typeCounts.entries()).map(([type, count]) => ({
    type,
    count
  }));
}

function calculateActiveUsers(statuses: UserArticleStatus[]): number {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Set(
    statuses
      .filter(status => status.readAt && new Date(status.readAt) >= last24h)
      .map(status => status.userId)
  ).size;
}

function calculateRecentArticles(articles: Article[]): number {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return articles.filter(article => article.createdAt && new Date(article.createdAt) >= last24h).length;
}

function calculateInactiveFeeds(feeds: Feed[], articles: Article[]): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeFeeds = new Set(
    articles
      .filter(article => article.createdAt && new Date(article.createdAt) >= thirtyDaysAgo)
      .map(article => article.feedId)
  );
  return feeds.length - activeFeeds.size;
}

function calculateSummarizerPerformance(summaries: Summary[]): SummarizerPerformance[] {
  const performanceMap = new Map<string, {
    totalSummaries: number;
    totalLength: number;
    successful: number;
  }>();
  
  summaries.forEach(summary => {
    if (!summary.summarizerId) return;
    
    if (!performanceMap.has(summary.summarizerId)) {
      performanceMap.set(summary.summarizerId, {
        totalSummaries: 0,
        totalLength: 0,
        successful: 0
      });
    }
    
    const stats = performanceMap.get(summary.summarizerId)!;
    stats.totalSummaries++;
    stats.totalLength += summary.text?.length || 0;
    stats.successful += (summary.text?.length || 0) > 0 ? 1 : 0;
  });
  
  return Array.from(performanceMap.entries()).map(([id, stats]) => ({
    summarizerId: id,
    avgLength: Math.round(stats.totalLength / stats.totalSummaries),
    successRate: Math.round((stats.successful / stats.totalSummaries) * 100)
  }));
}

interface ExtendedAdminStats {
  // User Metrics
  totalUsers: number;
  activeUsersLast24h: number;
  premiumUsers: number;
  premiumConversionRate: number;
  
  // Content Metrics
  totalWebsites: number;
  totalFeeds: number;
  totalArticles: number;
  articlesLast24h: number;
  averageArticlesPerFeed: number;
  inactiveFeedsCount: number;
  
  // Engagement Metrics
  totalReadArticles: number;
  averageArticlesReadPerUser: number;
  readRate: number;
  mostReadWebsite: {
    name: string;
    readCount: number;
  };
  
  // Summarization Metrics
  totalSummaries: number;
  summariesLast24h: number;
  averageSummaryLength: number;
  summarizationSuccessRate: number;
  summarizerPerformance: SummarizerPerformance[];
  
  // Feedback Metrics
  openIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
  issuesByType: {
    type: string;
    count: number;
  }[];
}

const StatCard = ({ title, value, description, trend }: {
  title: string;
  value: number | string;
  description: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
}) => (
  <Card className="h-full bg-white hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1">
    <CardContent>
      <Typography className="text-lg font-semibold mb-2">{title}</Typography>
      <Typography className="text-3xl mb-4">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      <Typography className="text-sm text-gray-600">{description}</Typography>
      {trend && (
        <Typography className={`text-sm mt-2 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}% from last period
        </Typography>
      )}
    </CardContent>
  </Card>
);

// const PerformanceChart = ({ data }: { data: ChartData[] }) => (
//   <ResponsiveContainer width="100%" height={300}>
//     <BarChart data={data}>
//       <CartesianGrid strokeDasharray="3 3" />
//       <XAxis dataKey="name" />
//       <YAxis />
//       <Tooltip />
//       <Bar dataKey="value" fill="#3182ce" />
//     </BarChart>
//   </ResponsiveContainer>
// );

export default function EnhancedAdminDashboard() {
  const [stats, setStats] = useState<ExtendedAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const client = generateClient<Schema>();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch base statistics
      const [
        websites,
        feeds,
        articles,
        userPrefs,
        summaries,
        userArticleStatuses,
        feedback
      ] = await Promise.all([
        client.models.Website.list(),
        client.models.Feed.list(),
        client.models.Article.list(),
        client.models.UserPreferences.list(),
        client.models.Summary.list(),
        client.models.UserArticleStatus.list(),
        client.models.Feedback.list()
      ]);

      if (!websites.data || !feeds.data || !articles.data || !userPrefs.data || 
          !summaries.data || !userArticleStatuses.data || !feedback.data) {
        throw new Error('Failed to fetch some data');
      }

      // Calculate derived statistics
      const premiumUsers = userPrefs.data.filter(pref => pref.isPremium).length;
      const readArticles = userArticleStatuses.data.filter(status => status.isRead).length;

      // Set comprehensive stats
      setStats({
        totalUsers: userPrefs.data.length,
        activeUsersLast24h: calculateActiveUsers(userArticleStatuses.data),
        premiumUsers,
        premiumConversionRate: (premiumUsers / userPrefs.data.length) * 100,
        
        totalWebsites: websites.data.length,
        totalFeeds: feeds.data.length,
        totalArticles: articles.data.length,
        articlesLast24h: calculateRecentArticles(articles.data),
        averageArticlesPerFeed: articles.data.length / feeds.data.length,
        inactiveFeedsCount: calculateInactiveFeeds(feeds.data, articles.data),
        
        totalReadArticles: readArticles,
        averageArticlesReadPerUser: readArticles / userPrefs.data.length,
        readRate: (readArticles / articles.data.length) * 100,
        mostReadWebsite: calculateMostReadWebsite(userArticleStatuses.data, articles.data, websites.data),
        
        totalSummaries: summaries.data.length,
        summariesLast24h: calculateRecentSummaries(summaries.data),
        averageSummaryLength: calculateAverageSummaryLength(summaries.data),
        summarizationSuccessRate: calculateSummarizationSuccessRate(summaries.data),
        summarizerPerformance: calculateSummarizerPerformance(summaries.data),
        
        openIssues: feedback.data.filter(f => f.status !== 'RESOLVED').length,
        resolvedIssues: feedback.data.filter(f => f.status === 'RESOLVED').length,
        averageResolutionTime: calculateAverageResolutionTime(feedback.data),
        issuesByType: calculateIssuesByType(feedback.data)
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4">Admin Dashboard</Typography>
        <Box className="flex gap-4">
          <Button
            component={Link}
            to="/admin/crud"
            variant="contained"
            color="primary"
          >
            Manage Resources
          </Button>
          <Button
            component={Link}
            to="/admin/feedback"
            variant="contained"
            color="primary"
          >
            Manage Feedback
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} className="mb-6">
        <Tab label="Overview" />
        <Tab label="User Metrics" />
        <Tab label="Content" />
        <Tab label="Summarization" />
        <Tab label="Feedback" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              description="Total registered users"
              trend={{ direction: 'up', percentage: 12 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Premium Users"
              value={stats.premiumUsers}
              description={`${stats.premiumConversionRate.toFixed(1)}% conversion rate`}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Active Users (24h)"
              value={stats.activeUsersLast24h}
              description="Users who read articles in last 24h"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Read Rate"
              value={`${stats.readRate.toFixed(1)}%`}
              description="Percentage of articles read"
            />
          </Grid>
        </Grid>
      )}

      {/* Additional tab content would be implemented here */}
    </Box>
  );
}
