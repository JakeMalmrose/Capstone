import { useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Alert } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import FeedCreateForm from '../../ui-components/FeedCreateForm';
import { Button } from '@aws-amplify/ui-react';
import { Link, useParams } from 'react-router-dom';

const client = generateClient<Schema>();

function AdminEditFeeds() {
    const { websiteId } = useParams<{ websiteId: string }>();
    const [website, setWebsite] = useState<Schema["Website"]["type"] | null>(null);
    const [feeds, setFeeds] = useState<Array<Schema["Feed"]["type"]>>([]);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWebsite = useCallback(async () => {
        if (!websiteId) return;
        try {
            const { data } = await client.models.Website.get({ id: websiteId });
            setWebsite(data);
        } catch (err) {
            setError('Failed to fetch website. Please try again.');
        }
    }, [websiteId]);

    const deleteFeed = async (id: string) => {
        try {
            await client.models.Feed.delete({ id });
            await fetchFeeds();
        } catch (err) {
            setError('Failed to delete feed. Please try again.');
        }
    }

    const fetchFeeds = useCallback(async () => {
        if (!websiteId) return;
        try {
            const { data } = await client.models.Feed.list({
                filter: { websiteId: { eq: websiteId } }
            });
            setFeeds(data);
        } catch (err) {
            setError('Failed to fetch feeds. Please try again.');
        }
    }, [websiteId]);

    useEffect(() => {
        fetchWebsite();
        fetchFeeds();
    }, [fetchWebsite, fetchFeeds]);

    if (!websiteId) {
        return <div>Invalid website ID</div>;
    }
    return (
        <div>
            <h1>Editing Feeds for website: {website ? website.name : 'Loading...'}</h1>
            {error && <Alert variation="error">{error}</Alert>}
            <button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ Add Website'}
            </button>
            {showForm && (
                <FeedCreateForm
                onSubmit={(fields: any) => {
                  // Add the websiteId to the form data
                  return { ...fields, websiteId };
                }}
                onSuccess={() => {
                  setShowForm(false);
                  fetchFeeds();
                }}
                onError={(fields: any, errorMessage: any) => {
                  setError(`Failed to create feed: ${errorMessage}`);
                  console.error('Form fields at time of error:', fields);
                }}
              />
            )}
            <ul>
                {feeds.map(feed => (
                    <li key={feed.id}>
                        <Link to={`/admin/feed/${feed.id}`}>{feed.name}</Link>
                        <Button onClick={() => deleteFeed(feed.id)}>Delete</Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AdminEditFeeds;