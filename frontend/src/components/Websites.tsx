import { useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Alert } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import WebsiteCreateForm, { WebsiteCreateFormInputValues } from '../../ui-components/WebsiteCreateForm';

const client = generateClient<Schema>();

function Websites() {
  const [websites, setWebsites] = useState<Array<Schema["Website"]["type"]>>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebsites = useCallback(async () => {
    try {
      const { data } = await client.models.Website.list();
      setWebsites(data);
    } catch (err) {
      setError('Failed to fetch websites. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchWebsites();

    const subscription = client.models.Website.observeQuery().subscribe({
      next: ({ items }) => setWebsites(items),
      error: (err) => setError(err.message),
    });

    return () => subscription.unsubscribe();
  }, [fetchWebsites]);

  async function deleteWebsite(id: string) {
    try {
      await client.models.Website.delete({ id });
      await fetchWebsites();
    } catch (err) {
      setError('Failed to delete website. Please try again.');
    }
  }

  async function handleCreateSuccess() {
    setShowForm(false);
    setError(null);
    await fetchWebsites();
  }

  function handleCreateError(fields: WebsiteCreateFormInputValues, errorMessage: string) {
    setError(`Failed to create website: ${errorMessage}`);
    console.error('Form fields at time of error:', fields);
  }

  return (
    <div>
      <h1>Websites</h1>
      {error && <Alert variation="error">{error}</Alert>}
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ Add Website'}
      </button>
      {showForm && (
        <WebsiteCreateForm
          onSuccess={handleCreateSuccess}
          onError={handleCreateError}
        />
      )}
      <ul>
        {websites.map((website) => (
          <li key={website.id}>
            {website.name} - {website.url}
            <button onClick={() => deleteWebsite(website.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Websites;