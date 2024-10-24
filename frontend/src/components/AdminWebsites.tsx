import { useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Alert } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import WebsiteCreateForm, { WebsiteCreateFormInputValues } from '../../ui-components/WebsiteCreateForm';
import { Button } from '@aws-amplify/ui-react';
import { Link } from 'react-router-dom';

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

  async function createSummarizers() {
    // let openaiModel = await client.models.Summarizer.list({
    //   filter: {
    //     name: { eq: "OpenAI GPT-3.5" }
    //   }
    // });
    // await client.models.Summarizer.update({
    //   id: openaiModel.data[0].id,
    //   name: "OpenAI",
    // })
    try{console.log(await client.models.Summarizer.create({
      name: "OpenAI",
      description: "Fast, reliable summarization using GPT-3.5-turbo",
      tier: "FREE",
    }));
    
    console.log(await client.models.Summarizer.create({
      name: "Claude",
      description: "High-quality summarization using Anthropic's Claude",
      tier: "PRO"
    }));
    
    console.log(await client.models.Summarizer.create({
      name: "Local LLaMA",
      description: "Privacy-focused summarization using local LLaMA model",
      tier: "FREE"
    }));
    console.log("Summarizers created");
  }

  function handleCreateError(fields: WebsiteCreateFormInputValues, errorMessage: string) {
    //setError(`Failed to create website: ${errorMessage}`);
    console.error('Form fields at time of error:', fields);
  }

  return (
    <div>
      <h1>Websites</h1>
      <Button onClick={createSummarizers}>Create Summarizers</Button>
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
            {website.name} - {website.url} - {website.id}
            <button onClick={() => deleteWebsite(website.id)}>Delete</button>
            <Button
              as={Link}
              to={`/admin/editFeeds/${website.id}`}
              variation="primary"
              marginTop="1rem"
            >Edit feeds</Button>
            
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Websites;