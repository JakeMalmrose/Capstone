import json
import requests
from trafilatura import extract

def lambda_handler(event, context):
    article_url = event['article_url']
    
    response = requests.get(article_url)
    content = extract(response.text)
    
    article_content = {
        'url': article_url,
        'title': extract_title(response.text),  # You'll need to implement this
        'content': content,
        'author': extract_author(response.text),  # You'll need to implement this
        'publishDate': extract_date(response.text)  # You'll need to implement this
    }
    
    return article_content

def extract_title(html):
    # Implementation to extract title from HTML
    pass

def extract_author(html):
    # Implementation to extract author from HTML
    pass

def extract_date(html):
    # Implementation to extract publish date from HTML
    pass