import { Amplify } from "aws-amplify";
import type { Schema } from "../../data/resource";
import client from "../../services/client";

export const handler: Schema["rssToDB"]["functionHandler"] = async (event) => {
    try{
        const { feedUrl, websiteId } = event.arguments;
        if (typeof feedUrl !== 'string' || typeof websiteId !== 'string') {
            throw new Error('feedUrl and websiteId must be strings');
        }
        
        console.log(`Processing RSS feed: ${feedUrl}`);
        const websiteResponse = await client.models.Website.get({ id: websiteId },
            {
                authMode: 'apiKey',
            }
        );
        const website = websiteResponse.data;

        if (!website) {
            throw new Error('Website not found');
        }
        await client.models.Website.update({
            id: website.id,
            name: website.name + " updated",
        },
        {
            authMode: 'apiKey',
        })
        return { success: true, message: 'Processed RSS feed, website: ' + website.name };
    } catch (error) {
        console.error('Error processing RSS feed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            message: `Error processing RSS feed: ${errorMessage}`,
        };
    };
};
