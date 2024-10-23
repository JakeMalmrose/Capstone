import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { Collection, Card, Heading, Text, View, Loader, Button, Link } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Define interfaces for the data structures
interface ArticleData {
    url: string;
    title: string;
    fullText: string;
    createdAt: string;
}

function Article() {
    const { articleId } = useParams<{ articleId: string }>();
    const [article, setArticle] = useState<Schema['Article']['type'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchArticle() {
            if (!articleId) return;

            setLoading(true);
            try {
                const response = await client.models.Article.get({ id: articleId });
                setArticle(response.data);
            } catch (err) {
                console.error('Error fetching article:', err);
                setError('Failed to load article. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        fetchArticle();
    }, [articleId]);

    if (loading) return <Loader />;
    if (error) return <Text color="red">{error}</Text>;
    if (!article) return <Text>No article found</Text>;

    return (
        <View padding="2rem">
            <Heading level={1}>{article.title}</Heading>
            <Text>{article.createdAt}</Text>
            <Text>{article.fullText}</Text>
        </View>
    );
}

export default Article;