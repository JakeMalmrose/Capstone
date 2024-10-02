import json
import feedparser
from datetime import datetime

def lambda_handler(event, context):
    feed_url = event['feed_url']
    feed = feedparser.parse(feed_url)
    
    articles = []
    for entry in feed.entries:
        article = {
            'id': entry.get('id', entry.link),
            'title': entry.title,
            'url': entry.link,
            'publishDate': datetime(*entry.published_parsed[:6]).isoformat(),
            'author': entry.get('author', 'Unknown'),
            'description': entry.get('summary', '')
        }
        articles.append(article)
    
    return {
        'statusCode': 200,
        'body': json.dumps(articles)
    }