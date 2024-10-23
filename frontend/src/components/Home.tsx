import { Amplify } from 'aws-amplify';
import { Heading, Text, View } from '@aws-amplify/ui-react';
import outputs from "../../amplify_outputs.json";
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';

const client = generateClient<Schema>();
Amplify.configure(outputs);


function Home() {  
  
  return (
    <View padding="1rem">
        <Heading level={1}>Home</Heading>
        <View marginTop="1rem">
          <Text fontSize="1.2rem">
            Dunno what im putting here, probably a list of user favorited websites
          </Text>
        </View>
    </View>
    
  );
}

export default Home;
