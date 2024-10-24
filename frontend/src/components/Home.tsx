import { Heading, Text, View } from '@aws-amplify/ui-react';


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
