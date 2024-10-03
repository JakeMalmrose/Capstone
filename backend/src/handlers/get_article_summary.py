import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
cache_table = dynamodb.Table('CacheTable')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    article_url = event['pathParameters']['article_id']
    
    # Check cache
    cache_response = cache_table.get_item(Key={'article_url': article_url})
    if 'Item' in cache_response:
        return {
            'statusCode': 200,
            'body': json.dumps(cache_response['Item'])
        }
    
    # Fetch article content
    fetch_response = lambda_client.invoke(
        FunctionName=os.environ['ARTICLE_FETCHER_FUNCTION_NAME'],
        InvocationType='RequestResponse',
        Payload=json.dumps({'article_url': article_url})
    )
    article_content = json.loads(fetch_response['Payload'].read())
    
    # Summarize article
    summarize_response = lambda_client.invoke(
        FunctionName=os.environ['SUMMARIZER_FUNCTION_NAME'],
        InvocationType='RequestResponse',
        Payload=json.dumps(article_content)
    )
    summary = json.loads(summarize_response['Payload'].read())
    
    # Cache summary
    cache_table.put_item(Item=summary)
    
    return {
        'statusCode': 200,
        'body': json.dumps(summary)
    }