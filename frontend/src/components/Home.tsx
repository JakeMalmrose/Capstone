import { Amplify } from 'aws-amplify';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Button, Heading, Text, View, TextField } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function Home() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSayHello = async () => {
    setLoading(true);
    setError(null);
    var result = null;
    try {
      result = await client.queries.sayHello({ name : name });
      if (result.data) {
        setGreeting(result.data);
      } else if (result.errors) {
        setGreeting("Error: ")
        throw new Error(result.errors.map((e: { message: any; }) => e.message).join(', '));
      } else {
        throw new Error('An unknown error occurred');
      }
    } catch (err) {
      console.error('Error calling sayHello:', err);
      setError(err instanceof Error ? err.message : 'Failed to get greeting. Please try again.');
    } finally {
      setLoading(false);
      console.log(result);
      console.log("trying query again");
      console.log(client.queries.sayHello({name: "hewwo"}));
    }
  };

  return (
    <View padding="1rem">
      <Heading level={1}>Welcome to Our Website</Heading>
      <View marginTop="1rem">
        <TextField
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </View>
      <Button
        onClick={handleSayHello}
        isLoading={loading}
        loadingText="Getting greeting..."
        marginTop="1rem"
      >
        Say Hello
      </Button>
      {greeting && (
        <Text marginTop="1rem" fontSize="1.2rem">
          {greeting}
        </Text>
      )}
      {error && (
        <Text marginTop="1rem" color="red">
          {error}
        </Text>
      )}
    </View>
  );
}

export default Home;